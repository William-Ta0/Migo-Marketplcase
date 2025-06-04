import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import "../styles/DeleteAccount.css";

const DeleteAccount = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { deleteAccount } = useAuth();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError("");
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account. Please try again later.");
    }
  };

  return (
    <div>
      <Button
        variant="contained"
        color="error"
        onClick={handleClickOpen}
        className="delete-account-button"
      >
        Delete Account
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="delete-dialog"
      >
        <DialogTitle id="alert-dialog-title" className="delete-dialog-title">
          {"Delete Your Account?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            className="delete-dialog-content"
          >
            Are you sure you want to delete your account? This action cannot be
            undone. All your data will be permanently deleted.
          </DialogContentText>
          {error && <p className="delete-dialog-error">{error}</p>}
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DeleteAccount;
