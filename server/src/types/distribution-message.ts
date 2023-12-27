export enum WorkshopDistributorRequestType {
  ADD = "ADD",
  GET = "GET",
}

interface WorkshopDistributorRequestBaseMessage {
  uuid: string;
  type: WorkshopDistributorRequestType;
  data: {
    profileId: string;
    sessionKey: string;
  };
}
export interface WorkshopDistributorRequestAddMessage
  extends WorkshopDistributorRequestBaseMessage {
  type: WorkshopDistributorRequestType.ADD;
  data: WorkshopDistributorRequestBaseMessage["data"] & {
    slotId: string;
    invitationId: string;
  };
}

export interface WorkshopDistributorRequestGetMessage
  extends WorkshopDistributorRequestBaseMessage {
  type: WorkshopDistributorRequestType.GET;
  data: Omit<
    WorkshopDistributorRequestAddMessage["data"],
    "invitationId" | "slotId"
  > & {
    invitationId?: string;
    slotId?: string;
  };
}

export interface WorkshopDistributionResult
  extends Omit<WorkshopDistributorRequestGetMessage, "type" | "data"> {
  data:
    | (WorkshopDistributorRequestGetMessage["data"] & {
        splitSessionKey: string | null;
        group: number | null;
      })
    | null;
  error: Error | null;
}
