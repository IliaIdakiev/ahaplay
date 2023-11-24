// import { AppContext } from "../types";

// export const authorize =
//   <TArgs, TResult>(
//     next: (parent: any, args: TArgs, context: AppContext, info: any) => TResult
//   ) =>
//   (parent: any, args: TArgs, context: AppContext, info: any): TResult => {
//     if (!context.authenticatedProfile) {
//       throw new Error("Not authenticated");
//     }

//     // Check if the authenticated user has the necessary role (e.g., ADMIN)
//     if (context.user.role !== "ADMIN") {
//       // Modify the behavior of the resolver to filter based on the user's ID
//       return next(
//         parent,
//         { filter: { userId: context.user.id } },
//         context,
//         info
//       );
//     }

//     return next(parent, args, context, info);
//   };
