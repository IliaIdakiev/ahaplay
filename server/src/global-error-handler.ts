import { error } from "console";
import { NextFunction, Request, Response } from "express";

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(error);
  res.status(500).json({ message: "Internal server error" });
}
