// import { createMachine, assign } from "xstate";
// createMachine(
//   {
//     id: "1339bbff-09f1-4961-a590-80da2a188baa",
//     context: {
//       requiredActiveProfileCount: 3,
//       currentActiveProfiles: [],
//       readyActiveProfiles: [],
//       activityResult: {},
//     },
//     initial: "waiting",
//     states: {
//       waiting: {
//         on: {
//           join: {
//             target: "waiting",
//             actions: ["join"],
//           },
//           disconnect: {
//             target: "waiting",
//             actions: ["disconnect"],
//           },
//           readyToStart: [
//             {
//               target:
//                 "#1339bbff-09f1-4961-a590-80da2a188baa.34b3102c-fc76-422d-bca9-f4157996d9ad",
//               cond: "isReadyToStart",
//               actions: ["readyToStart"],
//             },
//             {
//               target: "waiting",
//               actions: ["readyToStart"],
//             },
//           ],
//         },
//       },
//       "34b3102c-fc76-422d-bca9-f4157996d9ad": {
//         initial: "individual",
//         states: {
//           individual: {
//             on: {
//               setValue: {
//                 target: "individual",
//                 actions: ["setValue"],
//               },
//               setReady: [
//                 {
//                   target: "group",
//                   actions: ["setReady"],
//                   cond: "isReadyToForNextStep",
//                 },
//                 {
//                   target: "individual",
//                   actions: ["setReady"],
//                 },
//               ],
//             },
//           },
//           group: {
//             on: {
//               setValue: {
//                 target: "group",
//                 actions: ["setValue"],
//               },
//               setReady: [
//                 {
//                   target:
//                     "#1339bbff-09f1-4961-a590-80da2a188baa.eab4921d-84fa-40ab-b457-75d1d39bad5c",
//                   cond: "isReadyToForNextStep",
//                   actions: ["setReady"],
//                 },
//                 {
//                   target: "group",
//                   actions: ["setReady"],
//                 },
//               ],
//             },
//           },
//         },
//       },
//       "eab4921d-84fa-40ab-b457-75d1d39bad5c": {
//         initial: "individual",
//         states: {
//           individual: {
//             on: {
//               setValue: {
//                 target: "individual",
//                 actions: ["setValue"],
//               },
//               setReady: [
//                 {
//                   target: "#1339bbff-09f1-4961-a590-80da2a188baa.viewResults",
//                   actions: ["setReady"],
//                   cond: "isReadyToForNextStep",
//                 },
//                 {
//                   target: "individual",
//                   actions: ["setReady"],
//                 },
//               ],
//             },
//           },
//         },
//       },
//       viewResults: {
//         type: "final",
//       },
//     },
//     schema: {
//       events: {} as any,
//       context: {} as any,
//     },
//   },
//   {
//     actions: {
//       join: assign({
//         currentActiveProfiles: (context, { profileId }: JoinAction) =>
//           context.currentActiveProfiles.concat(profileId),
//       }),
//       disconnect: assign({
//         currentActiveProfiles: (context, { profileId }: DisconnectAction) =>
//           context.currentActiveProfiles.filter((id) => id !== profileId),
//       }),
//       readyToStart: assign({
//         readyActiveProfiles: (context, { profileId }: ReadyToStartAction) =>
//           context.readyActiveProfiles.concat(profileId),
//       }),
//       setValue: assign({
//         activityResult: (
//           context,
//           { value, profileId, activityId }: SetValueAction,
//           { state }
//         ) => {
//           const activity = Object.keys(state?.value || {})[0];
//           const mode = (state?.value as any)[activity] as
//             | "individual"
//             | "group"
//             | undefined;

//           if (!activity || mode === undefined || activityId !== activity) {
//             return context.activityResult;
//           }

//           let currentActivityResults =
//             context.activityResult?.[activity]?.[mode] || [];
//           const currentActivityResult = currentActivityResults.find(
//             (a) => a.profileId === profileId
//           ) || { value, profileId, ready: false };
//           currentActivityResult.value = value;
//           currentActivityResults = currentActivityResults
//             .filter((v) => v !== currentActivityResult)
//             .concat({ ...currentActivityResult });
//           return {
//             ...context.activityResult,
//             [activity]: {
//               ...context.activityResult[activity],
//               [mode]: currentActivityResults,
//             },
//           };
//         },
//       }),
//       setReady: assign({
//         activityResult: (context, data: SetReadyAction, { state }) => {
//           const { profileId, activityId } = data;
//           const activity = Object.keys(state?.value || {})[0];
//           const mode = (state?.value as any)[activity] as
//             | "individual"
//             | "group"
//             | undefined;

//           if (!activity || mode === undefined || activityId !== activity) {
//             return context.activityResult;
//           }

//           let currentActivityResults =
//             context.activityResult?.[activity]?.[mode] || [];
//           const currentActivityResult = currentActivityResults.find(
//             (a) => a.profileId === profileId
//           )!;
//           currentActivityResults = currentActivityResults
//             .filter((v) => v !== currentActivityResult)
//             .concat({ ...currentActivityResult, ready: true });

//           return {
//             ...context.activityResult,
//             [activity]: {
//               ...context.activityResult[activity],
//               [mode]: currentActivityResults,
//             },
//           };
//         },
//       }),
//     },
//     guards: {
//       isReadyToStart: (context, { profileId }) =>
//         context.readyActiveProfiles.concat(profileId).length ===
//         context.requiredActiveProfileCount,
//       isReadyToForNextStep: (context, { profileId }, { state }) => {
//         const activity = Object.keys(state.value)[0];
//         const mode = (state.value as any)[activity] as "individual" | "group";
//         if (mode === "individual") {
//           const isReady =
//             context.activityResult[activity][mode].length ===
//               context.requiredActiveProfileCount &&
//             context.activityResult[activity][mode]
//               .filter((val) => val.profileId !== profileId)
//               .every((a) => a.ready);
//           return isReady;
//         }
//         const isReady =
//           context.activityResult[activity][mode].length ===
//             context.requiredActiveProfileCount &&
//           context.activityResult[activity][mode]
//             .filter((val) => val.profileId !== profileId)
//             .every((a) => a.ready);
//         return isReady;
//       },
//     },
//   }
// );
