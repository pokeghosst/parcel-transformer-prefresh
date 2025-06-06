# parcel-transformer-prefresh

Transformer enabling [prefresh](https://github.com/preactjs/prefresh) Hot Module Reloading (HMR) in Preact apps using Parcel

## Installing

```
npm install --save-dev parcel-transformer-prefresh
```

## Usage

Add to `.parcelrc`:

```json
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.{js,jsx,ts,tsx}": ["parcel-transformer-prefresh", "..."]
  }
}
```

Add to your main entry file (e.g., `src/main.jsx`):

```jsx
import { render } from "preact";
import { App } from "./App";

if (process.env.NODE_ENV !== "production" && module.hot) {
  require("@prefresh/core");
}

render(<App />, document.getElementById("app"));
```

Serve your app:

```
parcel serve src/index.html
```

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

For bugs and feature requests, don't hesitate to open issues!

## License

The project is released under the [MIT License](LICENSE).
