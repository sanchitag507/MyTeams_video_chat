# MyTeams_video_chat

## Run the webapp
After Cloning the given repo, run-

**[npm install](https://docs.npmjs.com/cli/v7/commands/npm-install)** - Install the required dependencies

**[node server.js](https://stackabuse.com/how-to-start-a-node-server-examples-with-the-most-popular-frameworks)** - Run the server

## Technology used
**Backend**: Node js , Express js

**Frontend**: HTML , CSS , JS , JQ, Bootstrap

**WebSocket**: socket.io

**WebRTC**:peerjs server and client

**Database**: MongoDB

## Features
### User Authentication: 
 - **Authentication**- Using **Passport Local** for authenticating user and **Bcrypt** to hash the password and store it in a Mongodb database.

 - **Forgot Password**- In case user forgets his password , he may click on the forgot password and enter his e-mail and a mail would be send to his mail id using **nodemailer** containing the link to reset his password.

 - **Reset Password**- When user clicks on the link on the mail , he would be redirected to a reset password page containing the token generated using **Crypto** which would remain valid for 1 hour. Updating the password would send a confirmation link in his mail id using **nodemailer**.

 *User authentication is needed to use other features.*
 
 *Once the user is logged in he would be presented with a dashboard containing the options to **Generate a room ID for later use** or **Enter an existing room** or **start an instant meeting** .*
 
 ### Chat Room
 ***Peer js** is being used to share the Video and Audio among users in the same room.*
 
  - **Switch On or Off Video or Audio** - User may click on the **stop video** or **stop audio** button to switch on or off their video or audio.
 
  - **Chatting Features** - Users in the same room may chat with each other. This feature is using **Socket.io** to send and recieve messages.
 
  - **Meeting Details** - It would contain the Room ID the user is currently in.
 
  - **Leave meeting** - User may click on this button to leave the meeting and go to the home page.

## Agile methodologies used

*Initially I was given the task to only implement the video sharing feature, But later it was said to also integrate the chat room feature in it, So my codebase was modular and flexible enough to integrate this new feature in it*

*The intitial version of the product made by me was in itself complete and deployable, but it was also clean enough to allow testing and adding features to be easily done.*
 

