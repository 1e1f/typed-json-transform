declare interface SIO { [index: string]: any }

declare namespace Mongo {
  interface Document extends SIO {
    _id: string;
  }

  interface Collection {
    findOne: Function;
    find: Function;
    update: Function;
  }

  interface UpdateOptions {
    collection?: Collection;
    get?: Function;
    set?: Function;
    ignore?: string[];
  }

  interface Modifier {
    $set?: SIO;
    $unset?: SIO;
  }
}

declare namespace Keypath {
  interface Options extends SIO {
    allLevels?: boolean;
    diffArrays?: boolean;
  }
}