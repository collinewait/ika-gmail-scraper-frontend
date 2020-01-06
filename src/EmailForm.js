import React from "react";

const EmailForm = ({ email, handleSubmit, handleChange }) => (
  <div className="Form">
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        placeholder="Email that sent attachment"
        className="Form-drawingInput"
        onChange={handleChange}
      />

      <button
        data-download-btn="download-btn"
        type="submit"
        className="Form-button"
      >
        Download
      </button>
    </form>
  </div>
);

export default EmailForm;
