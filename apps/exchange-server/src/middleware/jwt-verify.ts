import { Auth } from "../services/auth-services/auth-model";
import { NextFunction, Request, RequestHandler, Response } from "express";
import {
  ApiResponse,
  HttpCodes,
  jwtVerifyAccessToken,
  ApiErrorHandling,
} from "../utils/utils-export";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    fullname: string;
    email: string;
  };
}

const verifyJWT: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token: string = req.cookies?.accessToken;
    if (!token) {
      throw new ApiErrorHandling(400, "token invalid");
    }
    const decodedToken = jwtVerifyAccessToken(token);

    if (!decodedToken) {
      throw new ApiErrorHandling(HttpCodes.BAD_REQUEST, "Invalid Token");
    }

    const user = await Auth.findById(decodedToken.UserPayLoad._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiErrorHandling(401, "Invalid Access Token");
    }
    req.user = Object(user);

    next();
  } catch (error) {
    if (error instanceof ApiErrorHandling) {
      res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, null, error.message));
    }
    res
      .status(HttpCodes.INTERNAL_SERVER_ERROR)
      .json(
        new ApiResponse(
          HttpCodes.INTERNAL_SERVER_ERROR,
          null,
          "Internal Server Error",
        ),
      );
  }
};

export { verifyJWT };
