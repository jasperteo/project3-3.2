import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { BASE_URL, SOCKET_URL } from "./Constants";
import { LineChart } from "@mui/x-charts/LineChart";

export default function SingleListing({ userId, axiosAuth }) {
  const [displayBid, setDisplayBid] = useState(0);
  const queryClient = useQueryClient();
  const params = useParams();
  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm();

  const fetcher = async (url) => (await axiosAuth.get(url)).data;
  const listing = useQuery({
    queryKey: ["listing", `${BASE_URL}/listings/${params.listingId}`],
    queryFn: () => fetcher(`${BASE_URL}/listings/${params.listingId}`),
  });
  const watch = useQuery({
    queryKey: ["watch", `${BASE_URL}/watches/${listing?.data?.watch_id}`],
    queryFn: () => fetcher(`${BASE_URL}/watches/${listing?.data?.watch_id}`),
    enabled: listing.isSuccess,
  });
  const priceHistory = useQuery({
    queryKey: [
      "priceHistory",
      `${BASE_URL}/watches/${listing?.data?.watch_id}/historicPrices`,
    ],
    queryFn: () =>
      fetcher(`${BASE_URL}/watches/${listing?.data?.watch_id}/historicPrices`),
    enabled: listing.isSuccess,
  });
  const highestBid = useQuery({
    queryKey: ["highestBid", `${BASE_URL}/listings/${params.listingId}/bid`],
    queryFn: () => fetcher(`${BASE_URL}/listings/${params.listingId}/bid`),
  });

  const initialBid =
    highestBid?.data?.current_bid ?? listing?.data?.starting_bid;
  const prices = priceHistory?.data?.map((item) => item.price);
  const dates = priceHistory?.data?.map((item) => new Date(item.transacted_at));

  const putRequest = async (url, data) => await axiosAuth.put(url, data);
  const { mutate } = useMutation({
    mutationFn: (formData) =>
      putRequest(`${BASE_URL}/listings/${params.listingId}/bid`, formData),
    onSuccess: (res) => {
      queryClient.setQueryData(
        ["highestBid", `${BASE_URL}/listings/${params.listingId}/bid`],
        res.data
      );
      queryClient.invalidateQueries({
        queryKey: [
          "highestBid",
          `${BASE_URL}/listings/${params.listingId}/bid`,
        ],
      });
    },
  });

  const socket = io(`${SOCKET_URL}`);

  useEffect(() => {
    socket.emit("joinRoom", params.listingId);
    socket.on("newBid", (bid) => setDisplayBid(bid));
    return () => socket.disconnect();
  }, [params.listingId, socket]);

  const onSubmit = (formData) => {
    const submitData = { ...formData, userId, listingId: params.listingId };
    console.log(submitData);
    mutate(submitData);
    socket.emit("submitBid", submitData);
    reset();
  };

  const endDate = listing?.data?.ending_at;

  if (listing.isLoading) {
    return (
      <>
        Loading... <iconify-icon icon="line-md:loading-twotone-loop" />
      </>
    );
  }

  if (listing.isError) {
    return <>Error: {listing.error.message}</>;
  }

  return (
    <>
      <div className="product-info">
        <img src={listing.data.image_link} width="400px" alt="Listing" />
        <h1>{listing.data.title}</h1>
      </div>
      <div className="auction-info">
        <p>Current Bid: ${displayBid || initialBid}</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Controller
              name="currentBid"
              control={control}
              defaultValue={(displayBid || initialBid) + 100}
              rules={{
                required: "Enter Bid",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Please enter only numbers",
                },
                validate: {
                  higherThanCurrentBid: (value) =>
                    Number(value) >= Number(displayBid || initialBid) + 100 ||
                    "Enter an amount at least $100 higher than current bid",
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="currentBid"
                  label="Bid"
                  variant="filled"
                  error={!!errors.currentBid}
                  helperText={errors?.currentBid?.message}
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
          <Button type="submit" variant="contained">
            BID NOW
          </Button>
        </form>
        <Button variant="contained">BUYOUT</Button>
        <Countdown endDate={endDate} />
      </div>
      <div className="line-chart">
        {!!priceHistory.data && (
          <LineChart
            xAxis={[
              {
                data: dates,
                scaleType: "time",
                valueFormatter: (value) =>
                  `${value.getFullYear()}-${
                    value.getMonth() + 1
                  }-${value.getDate()}`,
              },
            ]}
            series={[
              {
                data: prices,
              },
            ]}
            width={320}
            height={270}
          />
        )}
      </div>
    </>
  );
}

const Countdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: "0",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const timeDifference = end - now;

      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: days.toString(),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        });
      } else {
        setTimeLeft({
          days: "0",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
      }
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  return (
    <>
      <p>Auction Ends In</p>
      <p>
        <iconify-icon inline icon="ant-design:reload-time-outline" />{" "}
        {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes}
        minutes, {timeLeft.seconds} seconds
      </p>
    </>
  );
};
