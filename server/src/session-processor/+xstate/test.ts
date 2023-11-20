// getSessionWithWorkshopAndActivities("2624bc0f-71a0-4e2f-a1a7-7bd80cb9ac05")
//   .then(
//     (session) =>
//       [
//         convertWorkshopToMachine(session!.workshop!.id, session!.workshop!),
//         session!,
//       ] as const
//   )
//   .then(([machine, session]) => {
//     const activities = session.workshop!.activities!;
//     let service = interpret(machine)
//       .onTransition((state) => console.log(state.value, state.context))
//       .start();

//     service.getSnapshot();

//     service.send(createJoinAction({ profileId: "1" }));
//     service.send(createJoinAction({ profileId: "2" }));
//     service.send(createJoinAction({ profileId: "3" }));

//     service.send(createReadyToStartAction({ profileId: "1" }));
//     service.send(createReadyToStartAction({ profileId: "2" }));
//     service.send(createReadyToStartAction({ profileId: "3" }));

//     // start emotion
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "startEmotion",
//         value: "Good",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "startEmotion",
//         value: "Better",
//       })
//     );
//     service.send(createActivityTimeoutAction({ activityId: "startEmotion" }));
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: "startEmotion",
//     //     value: "Great",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: "startEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: "startEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: "startEmotion",
//     //   })
//     // );

//     // set team name
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "teamName",
//         value: "Good team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "teamName",
//         value: "Better team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "teamName",
//         value: "The greatest team",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "teamName",
//       })
//     );

//     // first activity stuff
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     // first activity review ready
//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     // second activity stuff
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[1].id,
//         value: "Hello from user 3 for activity 2",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[1].id,
//         value: "Hello from user 2 for activity 2",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[1].id,
//         value: "Hello from user 1 for activity 2",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[1].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[1].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[1].id,
//       })
//     );

//     // end emotion
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "endEmotion",
//         value: "Good",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "endEmotion",
//         value: "Better",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "endEmotion",
//         value: "Great",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "endEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "endEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "endEmotion",
//       })
//     );

//     console.log(service.getSnapshot().value, service.getSnapshot().context);
//   });

// getSessionWithWorkshopAndActivities("6bd51789-5a92-4475-9ba7-cd2750cbcaa0")
//   .then(
//     (session) =>
//       [
//         convertWorkshopToMachine(session!.workshop!.id, session!.workshop!),
//         session!,
//       ] as const
//   )
//   .then(([machine, session]) => {
//     const activities = session.workshop!.activities!;
//     let service = interpret(machine)
//       .onTransition((state) => console.log(state.value, state.context))
//       .start();

//     service.send(createJoinAction({ profileId: "1" }));
//     service.send(createJoinAction({ profileId: "2" }));
//     service.send(createJoinAction({ profileId: "3" }));

//     service.send(createReadyToStartAction({ profileId: "1" }));
//     service.send(createReadyToStartAction({ profileId: "2" }));
//     service.send(createReadyToStartAction({ profileId: "3" }));

//     // start emotion
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "startEmotion",
//         value: "Good",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "startEmotion",
//         value: "Better",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "startEmotion",
//         value: "Great",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "startEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "startEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "startEmotion",
//       })
//     );

//     // set team name
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "teamName",
//         value: "Good team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "teamName",
//         value: "Better team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "teamName",
//         value: "The greatest team",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "teamName",
//       })
//     );

//     // first activity stuff
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     // // first activity review ready
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: activities[0].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: activities[0].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: activities[0].id,
//     //   })
//     // );

//     // // second activity stuff
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "3",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 3 for activity 2",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "2",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 2 for activity 2",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 1 for activity 2",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: activities[1].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: activities[1].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: activities[1].id,
//     //   })
//     // );

//     // // end emotion
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "3",
//     //     activityId: "endEmotion",
//     //     value: "Good",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "2",
//     //     activityId: "endEmotion",
//     //     value: "Better",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: "endEmotion",
//     //     value: "Great",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: "endEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: "endEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: "endEmotion",
//     //   })
//     // );

//     console.log(service.getSnapshot().value, service.getSnapshot().context);
//   });
