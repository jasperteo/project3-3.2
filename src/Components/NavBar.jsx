import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimeField } from "@mui/x-date-pickers/DateTimeField";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  getDownloadURL,
  uploadBytes,
  ref as storageRef,
} from "firebase/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storage } from "./FirebaseConfig";
import { BASE_URL } from "./Constants";

export default function NavBar({ userId, axiosAuth }) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);
  const [open, setOpen] = useState(false);
  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm();

  useEffect(() => {
    switch (location.pathname) {
      case "/listing":
        setValue(0);
        break;
      case "/profile":
        setValue(2);
        break;
    }
  }, [location.pathname]);

  const fetcher = async (url) => (await axiosAuth.get(url)).data;
  const watches = useQuery({
    queryKey: ["watches", `${BASE_URL}/watches`],
    queryFn: () => fetcher(`${BASE_URL}/watches`),
  });

  const postRequest = async (url, data) => await axiosAuth.post(url, data);
  const { mutate } = useMutation({
    mutationFn: (formData) => postRequest(`${BASE_URL}/listings`, formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["listings", `${BASE_URL}/listings`],
      });
      queryClient.setQueryData(
        ["listing", `${BASE_URL}/listings/${res.data.id}`],
        res.data
      );
      navigate(`/listings/${res.data.id}`);
    },
  });

  const onSubmit = async (formData) => {
    let url = "";
    if (formData.imageLink) {
      const newStorageRef = storageRef(
        storage,
        `listing/${formData.imageLink.name}`
      );
      await uploadBytes(newStorageRef, formData.imageLink);
      url = await getDownloadURL(newStorageRef);
      mutate({
        ...formData,
        imageLink: url,
        userId: userId,
        endingAt: formData.endingAt.$d,
      });
    }
    reset();
    setOpen(false);
    console.log({
      ...formData,
      imageLink: url,
      userId: userId,
      endingAt: formData.endingAt.$d,
    });
  };

  const ListFormDialog = () => (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle sx={{ bgcolor: "#ebecf0" }}>List Item!</DialogTitle>
      <DialogContent sx={{ bgcolor: "#ebecf0" }}>
        <form>
          <div>
            <Controller
              name="title"
              control={control}
              defaultValue=""
              rules={{ required: "Enter Title" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  sx={{ m: 1, minWidth: 250 }}
                  id="title"
                  label="Title"
                  variant="filled"
                  error={!!errors.title}
                  helperText={errors?.title?.message}
                  margin="normal"
                />
              )}
            />
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              defaultValue=""
              rules={{ required: "Enter Description" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  sx={{ m: 1, minWidth: 250 }}
                  id="description"
                  label="Description"
                  variant="filled"
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors?.description?.message}
                  margin="normal"
                />
              )}
            />
          </div>
          <div>
            <Controller
              name="startingBid"
              control={control}
              defaultValue=""
              rules={{
                required: "Enter Starting Bid",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Please enter only numbers",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  sx={{ m: 1, minWidth: 250 }}
                  id="startingBid"
                  label="Starting Bid"
                  variant="filled"
                  error={!!errors.startingBid}
                  helperText={errors?.startingBid?.message}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0 },
                  }}
                />
              )}
            />
          </div>
          <div>
            <Controller
              name="buyoutPrice"
              control={control}
              defaultValue=""
              rules={{
                required: "Enter Buyout Price",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Please enter only numbers",
                },
                validate: {
                  higherThanStartingBid: (value, { startingBid }) =>
                    Number(value) >= Number(startingBid) ||
                    "Buyout Price must be higher than or equal to Starting Bid",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  sx={{ m: 1, minWidth: 250 }}
                  id="buyoutPrice"
                  label="Buyout Price"
                  variant="filled"
                  error={!!errors.buyoutPrice}
                  helperText={errors?.buyoutPrice?.message}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                    inputProps: { min: 0 },
                  }}
                />
              )}
            />
          </div>
          <div>
            <FormControl
              variant="filled"
              sx={{ m: 1, minWidth: 250 }}
              error={!!errors.watchId}>
              <InputLabel>Watch</InputLabel>
              <Controller
                name="watchId"
                control={control}
                defaultValue=""
                rules={{ required: "Select a Watch" }}
                render={({ field }) => (
                  <Select {...field} autoWidth id="watchId" defaultValue="">
                    {watches.data?.map((watch) => (
                      <MenuItem key={watch.id} value={watch.id}>
                        {watch.model}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText>{errors?.watchId?.message}</FormHelperText>
            </FormControl>
          </div>
          <div>
            <Controller
              name="endingAt"
              control={control}
              defaultValue=""
              rules={{ required: "Enter Date" }}
              render={({ field }) => (
                <DateTimeField
                  {...field}
                  sx={{ m: 1, minWidth: 250 }}
                  id="endingAt"
                  label="Ending Date"
                  format="D/M/YYYY hh:mm a"
                  error={!!errors.endingAt}
                  helperText={errors?.endingAt?.message}
                />
              )}
            />
          </div>
          <p>
            <Controller
              name="imageLink"
              control={control}
              defaultValue={null}
              rules={{ required: "Upload an image" }}
              render={({ field }) => (
                <Button
                  component="label"
                  endIcon={
                    <iconify-icon icon="ant-design:cloud-upload-outlined" />
                  }>
                  Upload Image
                  <input
                    style={{ display: "none" }}
                    type="file"
                    onChange={(e) => field.onChange(e.target.files[0])}
                  />
                </Button>
              )}
            />
          </p>
        </form>
      </DialogContent>
      <DialogActions sx={{ bgcolor: "#ebecf0" }}>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          endIcon={<iconify-icon icon="ant-design:send-outlined" />}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
        }}>
        <BottomNavigation
          sx={{ bgcolor: "#7BD3EA" }}
          showLabels
          value={value}
          onChange={(e, newValue) =>
            newValue !== 1 ? setValue(newValue) : null
          }>
          <BottomNavigationAction
            sx={{ "*": { color: value === 0 ? "#f76c6c" : "#24305E" } }}
            component={Link}
            to="/listings"
            label="Home"
            icon={<iconify-icon icon="ant-design:home-twotone" />}
          />
          <BottomNavigationAction
            sx={{ "*": { color: "#24305E" } }}
            label="Sell"
            onClick={() => setOpen(true)}
            icon={<iconify-icon icon="ant-design:plus-circle-twotone" />}
          />
          <BottomNavigationAction
            sx={{ "*": { color: value === 2 ? "#f76c6c" : "#24305E" } }}
            component={Link}
            to="/profile"
            label="Profile"
            icon={<iconify-icon icon="ant-design:user-outlined" />}
          />
        </BottomNavigation>
      </Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ListFormDialog />
      </LocalizationProvider>
    </>
  );
}
