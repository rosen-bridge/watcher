import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import express from "express";

// main()
const app = express();

app.get("/secret", (req, res) => {
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`app listenning on port ${port}`));

