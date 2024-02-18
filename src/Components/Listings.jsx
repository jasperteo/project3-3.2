import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Countdown from "./Countdown";
import Grid from "@mui/material/Grid";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BASE_URL } from "./Constants";

export default function Listings({ axiosAuth }) {
  const fetcher = async (url) => (await axiosAuth.get(url)).data;
  //Retrieve all the listings
  const listings = useQuery({
    queryKey: ["listings", `${BASE_URL}/listings`],
    queryFn: () => fetcher(`${BASE_URL}/listings`),
  });

  const cardColors = ["#f78888", "#f3d250", "#90ccf4", "#5da2d5"];

  return (
    <>
      <Grid container spacing={0}>
        <Box
          sx={{
            bgcolor: "#9AD4D6",
            padding: "1em",
            display: "flex",
            justifyContent: "center",
            width: "100%",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}>
          <img
            width="40"
            height="40"
            src="https://img.icons8.com/bubbles/200/watches-front-view--v2.png"
            alt="watches-front-view--v2"
          />
        </Box>
        {listings?.data?.map((listing, index) => (
          <Grid item xs={index % 3 === 0 ? 12 : 6} key={listing.id}>
            <Link to={`/listings/${listing.id}`}>
              <Card
                sx={{
                  backgroundColor: cardColors[index % cardColors.length],
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}>
                <CardContent sx={{ color: "#353839" }}>
                  <Box
                    sx={{
                      alignItems: "center",
                    }}>
                    {listing?.status === true ? (
                      <>
                        <div
                          style={{
                            fontSize: index % 3 !== 0 ? "0.6rem" : "1rem",
                          }}>
                          Auction Time Left:
                        </div>
                        <div
                          style={{
                            fontSize: index % 3 !== 0 ? "0.6rem" : "1rem",
                          }}>
                          <Countdown endDate={listing.ending_at} />
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: index % 3 !== 0 ? "0.6rem" : "1rem",
                        }}>
                        Auction Closed
                        <br />
                        <br />
                      </div>
                    )}
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
                  <div
                    style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
                    {listing.watch.model}
                  </div>
                  <div
                    style={{ fontSize: index % 3 !== 0 ? "0.6rem" : "1rem" }}>
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
