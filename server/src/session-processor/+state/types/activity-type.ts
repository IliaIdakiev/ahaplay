export enum ActivityType {
  Theory = "Theory", // main (-> concept)
  Assignment = "Assignment", // main (simple - no relation)
  Question = "Question", // main (simple - no relation -> answer)
  Benchmark = "Benchmark", // main (simple - no relation)
  Conceptualization = "Conceptualization", // main
  Concept = "Concept",
}

// Debate
// 1. Theory -> Conceptualization ->
// 1. assignment
// 2. questions
