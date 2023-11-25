## Development mode:

- Open terminal and run: `yarn docker:run:debug` which will run the docker container with synced dist directory and will automatically reload the server whenever there are changes in dist.

- Open another terminal and run: `yarn build:watch` which will watch src directory and will automatically re-build the project (update the dist directory which will then get auto reflected on the docker container).

## Debugging:

- Open visual studio code debug tab and choose `"Attach to server"`configuration and press run. This will attach the vsc to the docker server and will allow you to debug the code. **KEEP IN MIND** that whenever there are changes the server will be reloaded (restarted) so those changes can take effect which will stop the "Attach to server" debug process so **if you want to debug the updated code you will have to attach to the process again**.
