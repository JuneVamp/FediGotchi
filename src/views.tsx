import { FC , useEffect, useState} from "hono/jsx";
import { PetView } from "./pet.ts";

export const Layout: FC = (props) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />
      <meta http-equiv="Refresh" content="1" />

      <title>Microblog</title>
      <link
        rel="stylesheet"
        // href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        href="./styles/style.css"
      />
    </head>
    <body>
      <main class="container">{props.children}</main>
    </body>
  </html>
);

export interface PetViewProps {
  pet : PetView
}

export const PetComponent: FC<PetViewProps> = ({pet}) => (
  <>
    <img src = {pet.imageSrc}></img>
    <div>{"name: " + pet.name}</div>
    <div>{"environment: " + pet.environmentName}</div>
    <div>{"boredom: " + pet.boredom}</div>
    <div>{"current activity: " + pet.currentActivityName}</div>
    <div>{"current activity partner: " + pet.currentActivityPartnerName}</div>
  </>
);

export const PetListComponent: FC<{pets : Array<PetView>}> = ({pets}) => {
    // const [petViews, setPetViews] = useState<Array<PetView>>(pets)

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setPetViews(pets.map(pet => pet.getModel().getView()))
    //     }, 1000);
    //     return () => clearInterval(interval);
    // }, [pets])

    return (
    <>
        {pets.map((pet : PetView) => (
            <PetComponent pet = {pet}></PetComponent>
        ))}
    </>
    )
}

