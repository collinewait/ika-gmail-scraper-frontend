import React from "react";
import { render, fireEvent, wait } from "@testing-library/react";
import jwt from "jsonwebtoken";

import App from "./App";

const setUp = () => {
  const {
    getByText,
    getByPlaceholderText,
    container,
    getByRole,
    queryByRole
  } = render(<App />);
  return {
    getByText,
    getByPlaceholderText,
    container,
    getByRole,
    queryByRole
  };
};

const generateToken = () =>
  jwt.sign(
    {
      data: "foobar"
    },
    "test-secret",
    { expiresIn: "1h" }
  );

describe("App module", () => {
  const glob = global.URL;
  const originalLocation = window.location;
  const env = process.env;

  beforeEach(() => {
    delete window.location;
    window.location = {
      href: ""
    };
    jest.resetModules();
  });

  afterEach(() => {
    global.URL = glob;
    window.location = originalLocation;
    process.env = env;
  });

  test("it should contain a simple title", () => {
    const { getByText } = setUp();
    const simpleTitle = getByText(
      /Download Attachments sent by a specific email address/i
    );
    expect(simpleTitle).toBeInTheDocument();
  });

  test("it should contain a place holder in the input field", () => {
    const { getByPlaceholderText } = setUp();
    const placeHolder = getByPlaceholderText(/Email that sent attachment/i);
    expect(placeHolder).toBeInTheDocument();
  });

  test("it should contain a download button", () => {
    const { container } = setUp();
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );
    expect(downloadBtn).toBeInTheDocument();
  });

  test("it should show errors when the email is invalid", async () => {
    const { getByPlaceholderText, container, getByRole } = setUp();
    const emailField = getByPlaceholderText(/Email that sent attachment/i);
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );

    fireEvent.change(emailField, { target: { value: "collinewait.com" } });
    fireEvent.click(downloadBtn);

    const alert = await getByRole("alert");
    expect(alert).toHaveTextContent(/invalid email/i);
  });

  test("it should not show errors when the email is valid", async () => {
    const { getByPlaceholderText, container, queryByRole } = setUp();
    const emailField = getByPlaceholderText(/Email that sent attachment/i);
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );

    fireEvent.change(emailField, { target: { value: "colline@wait.com" } });
    fireEvent.click(downloadBtn);

    const alert = await queryByRole("alert");
    expect(alert).toEqual(null);
  });

  test("it should allow a user to download", async () => {
    const sampleToken = generateToken();
    Storage.prototype.getItem = jest.fn(() => sampleToken);
    jest.spyOn(window, "fetch").mockImplementationOnce(() => {
      const response = { blob: jest.fn(), status: 200 };
      return Promise.resolve(response);
    });
    global.URL.createObjectURL = jest.fn(() => "details");
    global.URL.revokeObjectURL = jest.fn();

    const { getByPlaceholderText, container, getByRole } = setUp();
    const emailField = getByPlaceholderText(/Email that sent attachment/i);
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );

    fireEvent.change(emailField, { target: { value: "colline@wait.com" } });
    fireEvent.click(downloadBtn);

    await wait(() => {
      expect(getByRole("alert")).toHaveTextContent(/download completed/i);
    });
  });

  test("it should call a different domain when the token is undefined", async () => {
    Storage.prototype.getItem = jest.fn(() => null);
    const { getByPlaceholderText, container } = setUp();
    const emailField = getByPlaceholderText(/Email that sent attachment/i);
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );
    const expectedHref = "https://apibaseurl.com/auth/google/login";

    process.env.REACT_APP_API_BASE_URL = "https://apibaseurl.com";

    fireEvent.change(emailField, { target: { value: "colline@wait.com" } });
    fireEvent.click(downloadBtn);

    expect(window.location.href).toEqual(expectedHref);
  });

  test("it should call a different domain when the token has expired", async () => {
    const expiredToken = jwt.sign(
      {
        data: "foobar"
      },
      "test-secret",
      { expiresIn: "-10s" }
    );
    Storage.prototype.getItem = jest.fn(() => expiredToken);
    const { getByPlaceholderText, container } = setUp();
    const emailField = getByPlaceholderText(/Email that sent attachment/i);
    const downloadBtn = container.querySelector(
      '[data-download-btn="download-btn"]'
    );
    const expectedHref = "https://apibaseurl.com/auth/google/login";

    process.env.REACT_APP_API_BASE_URL = "https://apibaseurl.com";

    fireEvent.change(emailField, { target: { value: "colline@wait.com" } });
    fireEvent.click(downloadBtn);

    expect(window.location.href).toEqual(expectedHref);
  });

  test("it should download attachments after granting the app access to the mail", async () => {
    const access_token = generateToken();
    Storage.prototype.getItem = jest.fn(() => access_token);
    window.location.search = `?access_token=${access_token}`;
    jest.spyOn(window, "fetch").mockImplementationOnce(() => {
      const response = { blob: jest.fn(), status: 200 };
      return Promise.resolve(response);
    });
    global.URL.createObjectURL = jest.fn(() => "details");
    global.URL.revokeObjectURL = jest.fn();

    const { getByRole } = setUp();

    await wait(() => {
      expect(getByRole("alert")).toHaveTextContent(/download completed/i);
    });
  });

  test("it should display an error when the request is not successful", async () => {
    const access_token = generateToken();
    Storage.prototype.getItem = jest.fn(() => access_token);
    window.location.search = `?access_token=${access_token}`;
    jest.spyOn(window, "fetch").mockImplementationOnce(() => {
      const response = { error: "someErrorHere", status: 400 };
      return Promise.resolve(response);
    });
    global.URL.createObjectURL = jest.fn(() => "details");
    global.URL.revokeObjectURL = jest.fn();

    const { getByRole } = setUp();

    await wait(() => {
      expect(getByRole("alert")).toHaveTextContent(/Something went wrong/i);
    });
  });
});
