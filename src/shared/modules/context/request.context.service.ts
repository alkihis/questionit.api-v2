import { Injectable } from '@nestjs/common';
import { RequestContext } from './request.context.model';

@Injectable()
export class RequestContextService {
  get user() {
    const requestContext = this.currentRequest;
    return (requestContext && requestContext.req.user) || null;
  }

  get request() {
    const requestContext = this.currentRequest;
    return (requestContext && requestContext.req) || null;
  }

  get response() {
    const requestContext = this.currentRequest;
    return (requestContext && requestContext.res) || null;
  }

  get requestTime() {
    const requestContext = this.currentRequest;
    return (requestContext && requestContext.requestTime) || null;
  }

  private get currentRequest() {
    const requestContext = RequestContext.currentContext;
    return requestContext || null;
  }
}
