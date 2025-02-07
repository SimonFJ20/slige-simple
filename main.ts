import { Reporter } from "./info.ts";
import { AstCx } from "./ast.ts";
import { Parser } from "./parser.ts";
import { Resolver } from "./resolver.ts";
import { TyCx } from "./ty.ts";
import { Checker } from "./checker.ts";

if (Deno.args.length < 1) {
    throw new Error("no filename");
}

const filePath = Deno.args[0];
const text = await Deno.readTextFile(filePath);
console.log(text);

const rep = new Reporter(filePath, text);

const astCx = new AstCx();
const parser = new Parser(astCx, text, rep);
const ast = parser.parseFile();

const resolver = new Resolver(rep);
resolver.resolveFile(ast);
const re = resolver.resols();

console.log(re);

const tyCx = new TyCx();
const ch = new Checker(tyCx, re, rep);
