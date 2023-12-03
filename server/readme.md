## Building the project

- Building the server - Open a terminal and run `yarn build`.

- Building the docker image - Open a terminal and run `yarn docker:build`.

- Building the server in watch mode - Open a terminal and run `yarn build:watch`.

## Running the project (not in development mode / for development mode look at the next section)

- Build the project - `yarn build && yarn docker:build`

- Run the docker container - `yarn docker:run`

## Development mode:

- Open terminal and run: `yarn docker:run:debug` which will run the docker container with synced dist directory and will automatically reload the server whenever there are changes in dist.

- Open another terminal and run: `yarn build:watch` which will watch src directory and will automatically re-build the project (update the dist directory which will then get auto reflected on the docker container).

## Debugging:

- Debugging the server: Open visual studio code debug tab and choose `"Attach to server"`configuration and press run. This will attach the vsc to the docker server and will allow you to debug the code. **KEEP IN MIND** that if you are in **Development mode** whenever there are changes to the source code the server will be automatically reloaded (restarted) in order for the changes to take effect. This process will stop the current debug process so **if you want to debug again you will have to repeat the process**.

- Debugging the session processor: Open visual studio code debug tab and choose `"Attach to session processor"`configuration and press run. This will attach the vsc to the docker session processor and will allow you to debug the code. **KEEP IN MIND** that if you are in **Development mode** whenever there are changes to the source code the server will be automatically reloaded (restarted) in order for the changes to take effect. This process will stop the current debug process so **if you want to debug again you will have to repeat the process**.

### Debug setup information

- NodeJS Server is ran with ` --inspect=9230` when we run docker with debug, inside the nginx config there is another port which is poxing a port which is `9232`to`9230`and when docker is ran there is a configuration that is opening local`9230`and linking it to`9232`.

- NodeJS Session Processor debug port is determined by app.config.json file with property `sessionProcessorDebugPort` (it should be `9229` if we want to be able to debug from docker container). In nginx we have port `9231` which is poxing to `9229` and when docker is ran with debug mode we have `2992` is proxied to `9231`.

- POSTGRES is exposed via port `9856` from nginx and when we run the docker in debug mode this port is accessed from `5431`.

## Documentation

### Slots

This represents a scheduled/ongoing/passed session and we have two types:

- ALL - All invited users are playing together

- SPLIT - We split the invited users into multiple sessions
