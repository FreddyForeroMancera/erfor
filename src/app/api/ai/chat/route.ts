import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { answerWithAI } from "@/lib/ai";
import { fail, ok, readJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  message: z.string().min(2),
  conversationId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  environmentalFileId: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = schema.parse(await readJson(request));
    const conversation =
      input.conversationId
        ? await prisma.aIConversation.findUniqueOrThrow({ where: { id: input.conversationId } })
        : await prisma.aIConversation.create({
            data: {
              userId: user.id,
              clientId: input.clientId || undefined,
              projectId: input.projectId || undefined,
              environmentalFileId: input.environmentalFileId || undefined,
              title: input.message.slice(0, 80)
            }
          });

    await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "user", content: input.message } });
    const answer = await answerWithAI(input.message, input);
    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: answer.content, sources: JSON.stringify(answer.sources) }
    });
    return ok({ conversationId: conversation.id, message: answer.content, sources: answer.sources });
  } catch (error) {
    return fail(error);
  }
}
