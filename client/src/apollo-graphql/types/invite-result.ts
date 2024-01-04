import { Invitation } from "./invitation";

export interface InvitationResult {
  getInvitation: {
    invitation: Invitation;
    millisecondsToStart: number;
  };
}
