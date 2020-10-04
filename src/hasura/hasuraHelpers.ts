import { HasuraEventOperation, HasuraTriggerPayload } from "./hasuraTypes";

function throwKeyNotFoundError(key: string) {
  throw new Error(`key not found: ${key}`);
}

export function validateHasuraTriggerPayload(payload: HasuraTriggerPayload) {
  if (!payload.event) throwKeyNotFoundError("event");
  if (!payload.event.op) throwKeyNotFoundError("event.op");
  if (!payload.event.data) throwKeyNotFoundError("event.data");
  if (!payload.trigger?.name) throwKeyNotFoundError("trigger.name");
  if (!payload.table?.schema) throwKeyNotFoundError("table.schema");
  if (!payload.table?.name) throwKeyNotFoundError("table.name");
}

export function hasuraPayloadMatches(
  payload: HasuraTriggerPayload,
  op: HasuraEventOperation,
  schema: string,
  name: string
): boolean {
  return (
    payload.event.op === op &&
    payload.table.schema === schema &&
    payload.table.name === name
  );
}
