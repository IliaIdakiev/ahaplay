import { ActivityModelInstance, ActivityType } from "../../database";

export function withCancel<T>(
  asyncIterator: AsyncIterator<T | undefined>,
  onCancel: Function
): AsyncIterator<T | undefined> {
  let originalReturn = asyncIterator.return;

  asyncIterator.return = () => {
    onCancel();
    return originalReturn
      ? originalReturn.call(asyncIterator)
      : Promise.resolve({ value: undefined, done: true });
  };

  return asyncIterator;
}

export function determineActivityType(
  activity: ActivityModelInstance
): ActivityType {
  if (activity.isQuestion()) {
    return ActivityType.Question;
  }
  if (activity.isAssignment()) {
    return ActivityType.Assignment;
  }
  if (activity.isBenchmark()) {
    return ActivityType.Benchmark;
  }
  if (activity.isConcept()) {
    return ActivityType.Concept;
  }
  if (activity.isConceptualization()) {
    return ActivityType.Conceptualization;
  }
  // if (activity.isTheory()) {
  return ActivityType.Theory;
  // }
}

export function activityInstancesToStateActivityArray(
  activities: ActivityModelInstance[]
): { id: string; type: ActivityType }[] {
  return activities.map((a) => ({ id: a.id, type: determineActivityType(a) }));
}
