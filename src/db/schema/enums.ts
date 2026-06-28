import { pgEnum } from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["male", "female"]);
export const sizeEnum = pgEnum("size", ["small", "medium", "large"]);
export const colorEnum = pgEnum("color", [
  "black",
  "white",
  "brown",
  "golden",
  "gray",
  "cream",
  "tan",
  "fawn",
  "orange",
  "red",
  "brindle",
  "tricolor",
]);
export const statusEnum = pgEnum("status", [
  "in_shelter",
  "adopted",
  "in_foster",
  "deceased",
]);
export const specieEnum = pgEnum("specie", ["dog", "cat"]);

export type ColorValue =
  | "black"
  | "white"
  | "brown"
  | "golden"
  | "gray"
  | "cream"
  | "tan"
  | "fawn"
  | "orange"
  | "red"
  | "brindle"
  | "tricolor";
export type SexValue = "male" | "female";
export type SizeValue = "small" | "medium" | "large";
export type StatusValue = "in_shelter" | "adopted" | "in_foster" | "deceased";
export type SpecieValue = "dog" | "cat";
