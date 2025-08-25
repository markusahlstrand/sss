import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let problemDetails: ProblemDetails;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          problemDetails = {
            type: "validation_error",
            title: "Validation Error",
            status,
            detail:
              typeof exceptionResponse === "string"
                ? exceptionResponse
                : "Invalid input",
            instance: request.url,
          };
          break;
        case HttpStatus.UNAUTHORIZED:
          problemDetails = {
            type: "unauthorized",
            title: "Unauthorized",
            status,
            detail: "Authentication required",
            instance: request.url,
          };
          break;
        case HttpStatus.FORBIDDEN:
          problemDetails = {
            type: "forbidden",
            title: "Forbidden",
            status,
            detail:
              typeof exceptionResponse === "string"
                ? exceptionResponse
                : "Insufficient permissions",
            instance: request.url,
          };
          break;
        case HttpStatus.NOT_FOUND:
          problemDetails = {
            type: "not_found",
            title: "Not Found",
            status,
            detail:
              typeof exceptionResponse === "string"
                ? exceptionResponse
                : "Resource not found",
            instance: request.url,
          };
          break;
        case HttpStatus.CONFLICT:
          problemDetails = {
            type: "conflict",
            title: "Conflict",
            status,
            detail:
              typeof exceptionResponse === "string"
                ? exceptionResponse
                : "Resource conflict",
            instance: request.url,
          };
          break;
        default:
          problemDetails = {
            type: "internal_error",
            title: "Internal Server Error",
            status,
            detail:
              typeof exceptionResponse === "string"
                ? exceptionResponse
                : "An error occurred",
            instance: request.url,
          };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      problemDetails = {
        type: "internal_error",
        title: "Internal Server Error",
        status,
        detail: "An unexpected error occurred",
        instance: request.url,
      };
    }

    // Log the error with structured logging
    this.logger.error(
      `Error ${status}: ${problemDetails.detail}`,
      exception instanceof Error ? exception.stack : "Unknown error",
      "GlobalExceptionFilter"
    );

    response
      .status(status)
      .header("Content-Type", "application/problem+json")
      .json(problemDetails);
  }
}
