import React from "react";
import "./App.css";
import jwtDecode from "jwt-decode";

import Header from "./header";
import EmailForm from "./EmailForm";

const requestAccessToGmailAccount = () => {
  window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/google/login`;
};

const fetchAttachments = (authorization, setResolved, email, setError) => {
  const url = `${process.env.REACT_APP_API_BASE_URL}/download/attachment?emailThatSentAttach=${email}`;
  window
    .fetch(url, {
      headers: {
        Authorization: authorization
      },
      credentials: "include"
    })
    .then(resp => {
      if (resp.status !== 200) {
        setError("Something went wrong, please try again");
        setResolved(false);
      }
      return resp.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));

      const link = document.createElement("a");
      link.href = url;

      const date = new Date();
      const today = `${date.toLocaleDateString("en-US", {
        day: "numeric"
      })}-${date.toLocaleDateString("en-US", {
        month: "short"
      })}-${date.toLocaleDateString("en-US", { year: "numeric" })}`;
      link.setAttribute("download", `attachment-${today}.zip`);

      link.click();
      window.URL.revokeObjectURL(url);
      setError(null);
      setResolved(true);
    });
};

const getLoginToken = () => localStorage.getItem("login-token");
const decodeJwtToken = jwtToken => jwtDecode(jwtToken);
const getAuthorization = decodedToken => `Bearer ${decodedToken}`;

const getAttachments = (email, setResolved, setError) => {
  const loginToken = getLoginToken();
  if (loginToken) {
    const decodedToken = decodeJwtToken(loginToken);
    if (decodedToken.exp > Date.now() / 1000) {
      const bearer = getAuthorization(loginToken);
      fetchAttachments(bearer, setResolved, email, setError);
    } else {
      localStorage.setItem("email", email);
      requestAccessToGmailAccount();
    }
  } else {
    localStorage.setItem("email", email);
    requestAccessToGmailAccount();
  }
};

function App() {
  const [email, setEmail] = React.useState("");
  const [resolved, setResolved] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access_token");

    if (token) {
      localStorage.setItem("login-token", token);
      window.history.replaceState(null, null, window.location.pathname);
      const emailInStorage = localStorage.getItem("email");

      getAttachments(emailInStorage, setResolved, setError);

      localStorage.removeItem("email");
    }
  }, []);

  const handleSubmit = event => {
    event.preventDefault();
    const isValidEmail = validateEmail(email);
    if (isValidEmail) {
      getAttachments(email, setResolved, setError);
    } else {
      setResolved(false);
      setError("Invalid email address");
    }
  };

  const handleChange = event => {
    setEmail(event.target.value);
  };

  const validateEmail = email => {
    const regx = /.+@.+\..+/;
    return regx.test(email);
  };

  return (
    <div className="App">
      <Header />
      <h3 className="simple-heading">
        Download Attachments sent by a specific email address
      </h3>
      {error ? (
        <div role="alert" className="error-message">
          {error}
        </div>
      ) : null}
      {resolved ? (
        <div role="alert" className="success-message">
          Download completed!
        </div>
      ) : null}
      <EmailForm
        email={email}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;