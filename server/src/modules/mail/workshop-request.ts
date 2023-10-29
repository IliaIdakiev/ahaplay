// ???
// public void sendWorkshopRequestEmailToUser(WorkshopRequest workshopRequest) {
//     BusinessEmail businessEmail = new BusinessEmail();
//     businessEmail.setType(EmailType.SENDGRID);
//     businessEmail.setFrom(appProperties.getNoReplyEmail());
//     businessEmail.setTo(workshopRequest.getRequester().getEmail());

//     businessEmail.setTemplateId("d-b521ba7b6ae842a2aae392ef1b3a1fc4");
//     Map<String, String> templateParams = new HashMap<>();
//     templateParams.put("ProfileName", workshopRequest.getRequester().getName());
//     templateParams.put("WorkshopTitle", workshopRequest.getWorkshop().getTopic());
//     templateParams.put("WorkspaceContactEmail", "stavros.stavru@ahaplay.com");
//     businessEmail.setTemplateParams(templateParams);

//     send(businessEmail);
//   }
