import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BASE_URL } from "./Constants";
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

export default function Listings({ userId, axiosAuth }) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, setValue, getValues } = useForm();

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
  const wishlist = useQuery({
    queryKey: ["wishlist", `${BASE_URL}/users/${userId}/wishlist`],
    queryFn: () => fetcher(`${BASE_URL}/users/${userId}/wishlist`),
  });

  const putRequest = async (url, data) => await axiosAuth.put(url, data);
  //Updates the watches in user wishlist
  const { mutate } = useMutation({
    mutationFn: (formData) =>
      putRequest(`${BASE_URL}/users/${userId}/wishlist`, formData),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["wishlist", `${BASE_URL}/users/${userId}/wishlist`],
      }),
  });

  const onSubmit = async (formData) => {
    mutate({
      ...formData,
      userUd: userId,
    });
    console.log({
      ...formData,
      userUd: userId,
    });
  };

  //Use MUI Select Checkmarks and React Hook Forms to make a dropdown of watches to like and unlike (Low priority)

  //Add functionality to filter by liked watches (Low Priority)

  //Add useEffect for MUI Snackbar for notifying liked watches when listed after socket.io is set up (Low priority)
  const cardColors = ["#A8D0E6", "#374785", "#f76c6c", "#d4b483", "#24305E"];

  return (
    <>
      <Grid container spacing={0}>
        <Box
          sx={{
            backgroundColor: "#E2DFDF",
            padding: "15px",
            display: "flex",
            alignItems: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}>
          <FormControl size="small" sx={{ mr: 4, minWidth: 100 }}>
            <InputLabel id="watch-select-label">Watches</InputLabel>
            <Controller
              name="likedWatches"
              control={control}
              defaultValue={[]}
              // defaultValue={wishlist.data?.map((item) => item.watch_id) || []}
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
                      {/* <Checkbox
                        checked={wishlist.data?.some(
                          (item) => item.watch_id === watch.id
                        )}
                      /> */}
                      <ListItemText primary={watch.model} />
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <FormHelperText>Select watches you like</FormHelperText>
          </FormControl>
          <Button
            // size="small"
            variant="contained"
            onClick={handleSubmit(onSubmit)}>
            Update
          </Button>
        </Box>
        {listings.data?.map((listing, index) => (
          <Grid item xs={index % 3 === 0 ? 12 : 6} key={listing.id}>
            <Link to={`/listings/${listing.id}`}>
              <Card
                sx={{
                  backgroundColor: cardColors[index % cardColors.length],
                  height: index % 3 === 0 ? "393px" : "196px",
                  ":hover": {
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    borderRadius: 0,
                    alignItems: "center",
                  },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}>
                <CardContent>
                  <Box
                    sx={{
                      alignItems: "center",
                    }}>
                    <div
                      style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
                      Auction Time Left:
                    </div>
                    <div
                      style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
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
                    }}></CardMedia>
                  <p style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
                    {listing.watch.model}
                  </p>
                  <p style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
                    Starting at ${listing.starting_bid}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
