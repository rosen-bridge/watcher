import "reflect-metadata";
import express from "express";
import generateAddress from "./api/generateAddress";
import lockRSN from "./api/permit";

const app = express();
app.use('/address', generateAddress);
app.use('/permit',lockRSN);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`app listening on port ${port}`));
