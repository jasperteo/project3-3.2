import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BASE_URL } from "./Constants";

export default function Profile({ userId, axiosAuth, userData }) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { logout, user } = useAuth0();
  const { control, handleSubmit } = useForm();

  const putRequest = async (url, data) => await axiosAuth.put(url, data);
  const { mutate } = useMutation({
    mutationFn: (formData) =>
      putRequest(`${BASE_URL}/users/${userId}`, formData),
    onSuccess: (res) => {
      queryClient.setQueryData(
        ["user", `${BASE_URL}/users/${user?.email}`],
        res.data
      );
      queryClient.invalidateQueries({
        queryKey: ["user", `${BASE_URL}/users/${user?.email}`],
      });
    },
  });

  const onSubmit = (formData) => {
    mutate(formData);
    setIsEditing(false);
  };

  const LogoutButton = () => (
    <Button
      variant="contained"
      sx={{
        flex: 1,
        bgcolor: "#A6D9F7",
        color: "inherit",
        fontFamily: "inherit",
        fontWeight: "550",
      }}
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }>
      Log Out
    </Button>
  );

  return (
    <>
      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="username"
            control={control}
            defaultValue={userData?.username ?? ""}
            render={({ field }) => (
              <TextField
                {...field}
                id="username"
                label="Username"
                variant="filled"
                margin="normal"
              />
            )}
          />
          <br />
          <Button
            type="submit"
            variant="contained"
            sx={{
              flex: 1,
              bgcolor: "#A6D9F7",
              color: "inherit",
              fontFamily: "inherit",
              fontWeight: "550",
            }}>
            Submit
          </Button>
        </form>
      ) : (
        <>
          <h3>Username: {userData?.username || "Please enter username"} </h3>
          <Button
            variant="contained"
            sx={{
              flex: 1,
              bgcolor: "#A6D9F7",
              color: "inherit",
              fontFamily: "inherit",
              fontWeight: "550",
            }}
            onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        </>
      )}
      <br />
      <br />
      <div>
        <LogoutButton />
      </div>
    </>
  );
}
