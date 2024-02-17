import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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
    refetchInterval: 30000,
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
  const socket = io(`${SOCKET_URL}`);
  useEffect(() => {
    socket.emit("joinRoom", params.listingId);
    socket.on("newBid", (bid) => setDisplayBid(bid));
    return () => socket.disconnect();
  }, [params.listingId, socket]);

  //Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
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
    socket.emit("submitBid", submitData);
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
      <div style={{ backgroundColor: "#d4b483" }}>
        <div style={{ padding: "10px" }}>
          <img src={listing?.data?.image_link} width="40%" alt="Listing" />
          <div style={{ fontSize: "13px" }}>{watch?.data?.brand}</div>
          <div style={{ fontSize: "16px" }}>{watch?.data?.model}</div>
        </div>
        <div style={{ padding: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", margin: "0" }}>
                ${listing?.data?.starting_bid}
              </div>
              <div style={{ margin: "0", fontSize: "14px" }}>Start</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", margin: "0" }}>
                ${displayBid || initialBid}
              </div>
              <div style={{ margin: "0", fontSize: "14px" }}>Current</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", margin: "0" }}>
                ${listing.data.buyout_price}
              </div>
              <div style={{ margin: "0", fontSize: "14px" }}>Buyout</div>
            </div>
          </div>
          {status === "open" ? (
            <>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ paddingTop: "10px" }}>
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
                    gap: "5px",
                    padding: "10px",
                  }}>
                  <Button type="submit" variant="contained" style={{ flex: 1 }}>
                    BID NOW
                  </Button>
                  <Button
                    onClick={() => buyout()}
                    variant="contained"
                    style={{ flex: 1 }}>
                    BUYOUT
                  </Button>
                </div>
              </form>
              <div style={{ fontSize: "16px", paddingTop: "10px" }}>
                Auction Ends In:
              </div>
              <Countdown endDate={endDate} />{" "}
            </>
          ) : status === "winner" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "5px",
                padding: "10px",
                paddingTop: "20px",
              }}>
              <Button
                onClick={() => closeBid()}
                variant="contained"
                style={{ flex: 1 }}>
                Close Bid
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "5px",
                padding: "10px",
                paddingTop: "20px",
              }}>
              Auction Closed
            </div>
          )}
        </div>
        <div style={{ padding: "10px" }}>
          {/* <p>Historic Trend:</p> */}
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
                  ticks: {
                    fontColor: "white", // this here
                  },
                  gridLines: {
                    color: "rgba(255, 255, 255, 0.2)",
                  },
                },
              ]}
              series={[
                {
                  data: prices,
                },
              ]}
              width={360}
              height={280}
            />
          )}
        </div>
      </div>
    </>
  );
}
