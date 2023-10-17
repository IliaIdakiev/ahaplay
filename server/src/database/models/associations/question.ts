import { questionModel } from "../question";
import {
  workshopAssociationNames,
  assignmentAssociationNames,
  theoryAssociationNames,
} from "../constants";
import { activityModel } from "../activity";
import { assignmentModel } from "../assignment";
import { theoryModel } from "../theory";

questionModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
questionModel.belongsTo(assignmentModel, {
  foreignKey: "assignment_id",
  as: assignmentAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
questionModel.belongsTo(theoryModel, {
  foreignKey: "theory_id",
  as: theoryAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
