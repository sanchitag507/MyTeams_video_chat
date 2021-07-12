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
**Authentication**- Using **Passport Local** for authenticating user and **Bcrypt** to hash the password and store it in a Mongodb database.

**Forgot Password**- In case user forgets his password , he may click on the forgot password and enter his e-mail and a mail would be send to his mail id using **nodemailer** containing the link to reset his password.

**Reset Password**- When user clicks on the link on the mail , he would be redirected to a reset password page containing the token generated using **Crypto** which would remain valid for 1 hour. Updating the password would send a confirmation link in his mail id using **nodemailer**.

 *User authentication is needed to use other features.*

