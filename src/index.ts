import { main } from "./cardano/scanner/scanner";
import "reflect-metadata";
import { commitmentMain } from "./commitments/scanner/scanner";
import { commitmentCreationMain } from "./transactinos/commitmentCreation";

main()
commitmentMain()
commitmentCreationMain()
