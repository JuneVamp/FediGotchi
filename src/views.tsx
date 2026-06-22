import { FC , useEffect, useState} from "hono/jsx";
import { PetView } from "./petModel.ts";

//     export const Layout: FC = (props) => (
//   <html lang="en">
//     <head>
//       <meta charset="utf-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1" />
//       <meta name="color-scheme" content="light dark" />
//       <title>Microblog</title>
//       <link
//         rel="stylesheet"
//         href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
//       />
//     </head>
//     <body>
//       <main class="container">{props.children}</main>
//     </body>
//   </html>
// );

export interface PetViewProps {
  pet : PetView
}

export const PetComponent: FC<PetViewProps> = ({pet}) => (
  <>
    <img src = {pet.imageSrc}></img>
    <div>{"name: " + pet.name}</div>
  </>
);

