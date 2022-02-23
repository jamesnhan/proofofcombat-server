import { Quest } from "types/graphql";

const Descriptions = {
  [Quest.WashedUp]:
    "You were out on the water and you're not sure what happened. You woke up days later on a beach, barely alive. Maybe the dock workers can help...",
};

export function getQuestDescription(quest: Quest): string {
  return Descriptions[quest];
}