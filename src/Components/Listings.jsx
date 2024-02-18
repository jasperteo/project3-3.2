import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BASE_URL, SOCKET_URL } from "./Constants";
import { Link } from "react-router-dom";
import Countdown from "./Countdown";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import FormHelperText from "@mui/material/FormHelperText";
import { useForm, Controller } from "react-hook-form";
import { Snackbar } from "@mui/material";
import io from "socket.io-client";
import { useState, useEffect } from "react";

export default function Listings({ userId, axiosAuth }) {
  console.log(userId);
  const queryClient = useQueryClient();
  // const { control, handleSubmit, reset } = useForm();

  const fetcher = async (url) => (await axiosAuth.get(url)).data;
  //Retrieve all the listings
  const listings = useQuery({
    queryKey: ["listings", `${BASE_URL}/listings`],
    queryFn: () => fetcher(`${BASE_URL}/listings`),
  });
  //Retreive all watches to generate a list of watches to fill MUI Select Checkmarks to like and unlike
  const watches = useQuery({
    queryKey: ["watches", `${BASE_URL}/watches`],
    queryFn: () => fetcher(`${BASE_URL}/watches`),
  });
  //Retrieve the current user's liked watches
  // const wishlist = useQuery({
  //   queryKey: ["wishlist", `${BASE_URL}/users/${userId}/wishlist`],
  //   queryFn: () => fetcher(`${BASE_URL}/users/${userId}/wishlist`),
  // });

  // const putRequest = async (url, data) => await axiosAuth.put(url, data);
  // //Updates the watches in user wishlist
  // const { mutate } = useMutation({
  //   mutationFn: (formData) =>
  //     putRequest(`${BASE_URL}/users/${userId}/wishlist`, formData),
  //   onSuccess: () =>
  //     queryClient.invalidateQueries({
  //       queryKey: ["wishlist", `${BASE_URL}/users/${userId}/wishlist`],
  //     }),
  // });
  //update the wishlist
  // const onSubmit = async (formData) => {
  //   mutate({
  //     selectedWatchId: formData.likedWatches,
  //   });
  //   console.log({
  //     likedWatches: formData.likedWatches,
  //   });
  //   reset();
  // };

  //socket to handle snackbar
  // const socket = io(`${SOCKET_URL}`);

  // const [snackbarOpen, setSnackbarOpen] = useState(false);
  // const [snackbarMessage, setSnackbarMessage] = useState("");

  // useEffect(() => {
  //   socket.emit("register", userId);
  //   socket.on("watch-listed", (watch) => {
  //     setSnackbarMessage(`A watch you like has been listed: ${watch.name}`);
  //     setSnackbarOpen(true);
  //   });
  //   return () => socket.disconnect();
  // }, [socket, userId]);

  // const handleCloseSnackbar = () => {
  //   setSnackbarOpen(false);
  // };

  //Add useEffect for MUI Snackbar for notifying liked watches when listed after socket.io is set up (Low priority)
  const cardColors = ["#90ccf4", "#f3d250", "#f78888", "#5da2d5"];

  return (
    <>
      <Grid container spacing={0}>
        {/* <Box
          sx={{
            backgroundColor: "#E2DFDF",
            padding: "15px",
            display: "flex",
            alignItems: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        > */}
        {/* <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          /> */}
        {/* <FormControl size="small" sx={{ mr: 4, minWidth: 100 }}>
            <InputLabel id="watch-select-label">Watches</InputLabel>
            <Controller
              name="likedWatches"
              control={control}
              // defaultValue={[]}
              defaultValue={
                wishlist?.data?.watches.map((item) => item.watch_id) || []
              }
              render={({ field }) => (
                <Select
                  {...field}
                  labelId="watch-select-label"
                  multiple
                  renderValue={(selected) => selected.join(", ")}
                  // MenuProps={MenuProps}
                >
                  {watches.data?.map((watch) => (
                    <MenuItem key={watch.id} value={watch.id}>
                      <Checkbox
                        checked={wishlist.data?.watches?.some(
                          (item) => item.watch_id === watch.id
                        )}
                      />
                      <ListItemText primary={watch.model} />
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <FormHelperText>Select watches you like</FormHelperText>
          </FormControl>
          <Button
            variant="contained"
            // onClick={handleSubmit(onSubmit)}
            style={{
              backgroundColor: "#f78888",
            }}
          >
            Update
          </Button> */}
        {/* </Box> */}
        <Box
          sx={{
            backgroundColor: "#E2DFDF",
            padding: "15px",
            display: "flex",
            justifyContent: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <img
            width="40"
            height="40"
            src="https://img.icons8.com/bubbles/200/watches-front-view--v2.png"
            alt="watches-front-view--v2"
          />
        </Box>
        {/* <div className="header">WatchOut</div> */}
        {listings?.data?.map((listing, index) => (
          <Grid item xs={index % 3 === 0 ? 12 : 6} key={listing.id}>
            <Link to={`/listings/${listing.id}`}>
              <Card
                sx={{
                  backgroundColor: cardColors[index % cardColors.length],
                  // height: "0",
                  // paddingbottom: "20%",
                  ":hover": {
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    borderRadius: 0,
                    alignItems: "center",
                  },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <CardContent sx={{ color: "#353839" }}>
                  <Box
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}
                    >
                      Auction Time Left:
                    </div>
                    <div
                      style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}
                    >
                      <Countdown endDate={listing.ending_at} />
                    </div>
                  </Box>

                  <CardMedia
                    component="img"
                    image={listing.image_link}
                    alt={listing.title}
                    sx={{
                      width: "40%",
                      display: "block",
                      objectFit: "cover",
                      margin: "auto",
                    }}
                  ></CardMedia>
                  <div
                    style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}
                  >
                    {listing.watch.model}
                  </div>
                  <div
                    style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}
                  >
                    Starting at ${listing.starting_bid}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
