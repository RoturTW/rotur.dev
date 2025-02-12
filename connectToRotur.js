function connectToWebsocket(server, accounts, username, password) {
  // Show the spinner as we begin connecting
  showLoadingSpinner();

  // Also show a spinner on the submit button
  const submitButton = document.querySelector(".modal form button[type='submit']");
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  submitButton.disabled = true;

  window.account = undefined;
  this.ip = "";
  this.username = username;
  this.password = password;
  this.accounts = accounts;
  this.userToken = "";
  this.ws = new WebSocket(server);

  this.ws.onopen = () => {
    // Connection established: hide the spinner
    hideLoadingSpinner();

    this.ws.send(JSON.stringify({
      cmd: "handshake",
      val: {
        language: "Javascript",
        version: {
          editorType: "Scratch",
          versionNumber: null,
        },
      },
      listener: "handshake_cfg",
    }));

    this.ws.onmessage = (event) => {
      let packet = JSON.parse(event.data);
      if (packet.cmd == "client_ip") {
        this.ip = packet.val;
      } else if (packet.cmd == "pmsg") {
        if (packet.val.source_command == "login") {
          if ((""+packet.val.payload.username).toLowerCase() === this.username.toLowerCase()) {
            this.userToken = packet.val.token;
            window.account = packet.val.payload;
            console.log("Logged in!");
          } else {
            console.log("Failed to login!");
            submitButton.innerHTML = 'Login';
            submitButton.disabled = false;
          }
        }
      }
      if (packet.listener === "handshake_cfg") {
        let usernameWithPrefix = "ath-" + this.username;
        let msg = {
          cmd: "setid",
          val: usernameWithPrefix,
          listener: "set_username_cfg",
        };
        this.ws.send(JSON.stringify(msg));
      }
      if (packet.listener == "set_username_cfg") {
        let room = "roturTW";
        let msg = {
          cmd: "link",
          val: [room],
          listener: "link_cfg",
        };
        this.ws.send(JSON.stringify(msg));
      }
      if (packet.listener == "link_cfg") {
        this.ws.send(JSON.stringify({
          cmd: "pmsg",
          val: {
            ip: this.ip,
            client: {
              system: "rotur",
              version: "1.0",
            },
            command: "login",
            id: this.userToken,
            payload: [this.username, this.password],
          },
          id: this.accounts,
        }));
        console.log("Connected!");
      }
    };
  };

  this.ws.onclose = () => {
    console.log("Disconnected!");
    hideLoadingSpinner();
    submitButton.innerHTML = 'Login';
    submitButton.disabled = false;
  };
}

export { connectToWebsocket };