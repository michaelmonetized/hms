/* eslint-disable */
/**
 * Generated Convex server stubs for local development and type-checking.
 * These will be overwritten when running `npx convex dev`.
 */
import {
  GenericActionCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { DataModel } from "./dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

type Handler<Ctx, Args, Result> = (ctx: Ctx, args: Args) => Promise<Result> | Result;

interface FunctionBuilder<Ctx> {
  <Args = any, Result = any>(builder: { args?: any; handler: Handler<Ctx, Args, Result> }): any;
}

export declare const query: FunctionBuilder<QueryCtx>;
export declare const internalQuery: FunctionBuilder<QueryCtx>;
export declare const mutation: FunctionBuilder<MutationCtx>;
export declare const internalMutation: FunctionBuilder<MutationCtx>;
export declare const action: FunctionBuilder<ActionCtx>;
export declare const internalAction: FunctionBuilder<ActionCtx>;
export declare const httpAction: any;
