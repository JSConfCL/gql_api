import "./assets/assets";
import "./allowedCurrency/allowedCurrency";
import "./community/community";
import "./company/company";
import "./events/events";
import "./eventImages/eventImages";
import "./money/money";
import "./salary/salary";
import "./status/status";
import "./tags/tags";
import "./ticket/ticket";
import "./user/user";
import "./userTickets/userTickets";
import "./workEmail/workEmail";
import "./workRole/workRole";
import "./workSeniority/workSeniority";
import { builder } from "~/builder";

export const schema = builder.toSchema();
