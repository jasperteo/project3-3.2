import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import { LineChart } from "@mui/x-charts/LineChart";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { BASE_URL, SOCKET_URL } from "./Constants";
import Countdown from "./Countdown";

export default function SingleListing({ userId, axiosAuth }) {
  const [displayBid, setDisplayBid] = useState(0);
  const [status, setStatus] = useState("");
  const [socketBid, setSocketBid] = useState();
  const queryClient = useQueryClient();
  const params = useParams();
  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm();

  //GET Data
  const fetcher = async (url) => (await axiosAuth.get(url)).data;
  const listing = useQuery({
    queryKey: ["listing", `${BASE_URL}/listings/${params.listingId}`],
    queryFn: () => fetcher(`${BASE_URL}/listings/${params.listingId}`),
    refetchInterval: 10000,
  });
  const highestBid = useQuery({
    queryKey: ["highestBid", `${BASE_URL}/listings/${params.listingId}/bid`],
    queryFn: () => fetcher(`${BASE_URL}/listings/${params.listingId}/bid`),
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

  //Show bid amount, use starting bid if no one has started bidding
  const initialBid =
    highestBid?.data?.current_bid ?? listing?.data?.starting_bid;

  //Data for graphing
  const prices = priceHistory?.data?.map((item) => item.price);
  const dates = priceHistory?.data?.map((item) => new Date(item.transacted_at));

  //Data for countdown
  const endDate = listing?.data?.ending_at;

  //Place Bid
  const putRequest = async (url, data) => await axiosAuth.put(url, data);
  const { mutate } = useMutation({
    mutationFn: (formData) =>
      putRequest(`${BASE_URL}/listings/${params.listingId}/bid`, formData),
    onSuccess: (res) => {
      //Store in cache
      queryClient.setQueryData(
        ["highestBid", `${BASE_URL}/listings/${params.listingId}/bid`],
        res.data
      );
      //Revalidate source of truth
      queryClient.invalidateQueries({
        queryKey: [
          "highestBid",
          `${BASE_URL}/listings/${params.listingId}/bid`,
        ],
      });
    },
  });

  //Post requests for stripe payment
  const postRequest = async (url, data) => await axios.post(url, data);
  const { mutate: buyout } = useMutation({
    mutationFn: () =>
      postRequest(`${BASE_URL}/buyout`, {
        listingId: params.listingId,
        watchName: watch?.data?.model,
      }),
    onSuccess: (res) => (window.location = res.data.url),
  });
  const { mutate: closeBid } = useMutation({
    mutationFn: () =>
      postRequest(`${BASE_URL}/closeBid`, {
        listingId: params.listingId,
        watchName: watch?.data?.model,
      }),
    onSuccess: (res) => (window.location = res.data.url),
  });

  //Socket to communicate and recieve bids

  useEffect(() => {
    const socket = io(`${SOCKET_URL}`);
    setSocketBid(socket);
    window.scrollTo(0, 0);
    socket.emit("joinRoom", params.listingId);
    socket.on("newBid", (bid) => setDisplayBid(bid));
    return () => socket.disconnect();
  }, [params.listingId]);

  useEffect(() => {
    if (
      listing?.data?.status === false &&
      listing?.data?.buyer_id == null &&
      highestBid?.data?.bidder_id === userId
    ) {
      setStatus("winner");
    } else if (listing?.data?.status === false) {
      setStatus("closed");
    } else setStatus("open");
  }, [highestBid, listing, userId]);

  const onSubmit = (formData) => {
    const submitData = { ...formData, userId, listingId: params.listingId };
    mutate(submitData);
    socketBid.emit("submitBid", submitData);
    reset();
  };

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
      <Box sx={{ bgcolor: "#CFE0C3" }}>
        <div style={{ padding: "0.6em" }}>
          <img
            src={listing?.data?.image_link}
            style={{ maxHeight: "30em" }}
            alt="Listing"
          />
          <div style={{ fontSize: "0.8em" }}>{watch?.data?.brand}</div>
          <div style={{ fontSize: "1em", fontWeight: "600" }}>
            {watch?.data?.model}
          </div>
          <div
            style={{
              fontSize: "1em",
              fontWeight: "600",
              paddingBottom: "2em",
            }}>
            Ref No. {watch?.data?.ref_num}
          </div>
          <div style={{ fontSize: "1em", fontWeight: "600" }}>
            Title:
            <br /> {listing?.data?.title}
          </div>
          <div style={{ fontSize: "0.9em" }}>
            Description:
            <br /> {listing?.data?.description}
          </div>
        </div>
        <div
          style={{
            padding: "0.75em",
            paddingTop: "1.25em",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "1.5em", margin: "0", fontWeight: "bold" }}>
                ${listing?.data?.starting_bid}
              </div>
              <div style={{ margin: "0", fontSize: "0.9em" }}>Start</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "1.5em", margin: "0", fontWeight: "bold" }}>
                ${displayBid || initialBid}
              </div>
              <div style={{ margin: "0", fontSize: "0.9em" }}>Current</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "1.5em", margin: "0", fontWeight: "bold" }}>
                ${listing.data.buyout_price}
              </div>
              <div style={{ margin: "0", fontSize: "0.9em" }}>Buyout</div>
            </div>
          </div>
          {status === "open" ? (
            <>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ paddingTop: "0.75em" }}>
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
                          Number(value) >=
                            Number(displayBid || initialBid) + 100 ||
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
                        fullWidth
                      />
                    )}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.3em",
                    padding: "0.75em",
                  }}>
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
                    BID NOW
                  </Button>
                  <Button
                    onClick={() => buyout()}
                    variant="contained"
                    sx={{
                      flex: 1,
                      bgcolor: "#A6D9F7",
                      color: "inherit",
                      fontFamily: "inherit",
                      fontWeight: "550",
                    }}>
                    BUYOUT
                  </Button>
                </div>
              </form>
              <div style={{ fontSize: "1em", paddingTop: "0.75em" }}>
                Auction Ends In:
              </div>
              <Countdown endDate={endDate} />{" "}
            </>
          ) : status === "winner" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.3em",
                padding: "0.75em",
                paddingTop: "1.25",
              }}>
              <Button
                onClick={() => closeBid()}
                variant="contained"
                sx={{
                  flex: 1,
                  bgcolor: "#A6D9F7",
                  color: "inherit",
                  fontFamily: "inherit",
                  fontWeight: "550",
                }}>
                Close Bid
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.3em",
                padding: "0.75em",
                paddingTop: "1.5em",
              }}>
              Auction Closed
            </div>
          )}
        </div>
        <div
          style={{
            padding: "0.75em",
            display: "flex",
            justifyContent: "center",
          }}>
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
                  label: "Price (SGD)",
                  data: prices,
                },
              ]}
              slotProps={{
                legend: {
                  labelStyle: {
                    fontSize: 14,
                  },
                },
              }}
              width={360}
              height={280}
            />
          )}
        </div>
      </Box>
    </>
  );
}
