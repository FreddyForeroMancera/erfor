import { CheckCircle2, Circle, Clock } from "lucide-react";

export function ProjectTimeline({ status }: { status: string }) {
  const steps = [
    { id: "PREPARATION", label: "En Preparación" },
    { id: "FILED", label: "Radicado" },
    { id: "EVALUATION", label: "En Evaluación" },
    { id: "APPROVED", label: "Aprobado / Finalizado" }
  ];

  const currentIdx = steps.findIndex(s => s.id === status) >= 0 ? steps.findIndex(s => s.id === status) : 
                     (status === 'REQUIREMENT' ? 2 : (status === 'COMPLETED' ? 3 : 0));

  return (
    <div className="py-4">
      <div className="relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 -translate-y-1/2 bg-slate-200"></div>
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-erfor-green transition-all duration-500"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
        ></div>
        <ul className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            
            return (
              <li key={step.id} className="flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white ring-4 ring-white ${isCompleted ? "text-erfor-green" : isCurrent ? "text-erfor-green border-2 border-erfor-green" : "text-slate-300"}`}>
                  {isCompleted || isCurrent ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent || isCompleted ? "text-slate-800" : "text-slate-500"}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
