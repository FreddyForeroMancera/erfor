import { z } from "zod";
import { WorkStatus } from "@prisma/client";

export const statusSchema = z.object({ status: z.nativeEnum(WorkStatus) });
