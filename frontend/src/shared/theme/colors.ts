interface IColors {
  buttons: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  texts: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    quinary: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  table: {
    primary: string;
    lines: string;
    header: string;
  };
  asideNavBackground: {
    primary: string;
  };
  states: {
    info?: any;
    error?: any;
    warning?: any;
    success: string;
    completed: string;
    pending: string;
    inactive: string;
    nullable: string;
    appointment: {
      finalizado: {
        background: string;
        text: string;
      };
      pendiente: {
        background: string;
        text: string;
      };
      cancelado: {
        background: string;
        text: string;
      };
      enProceso: {
        background: string;
        text: string;
      };
      cerrado: {
        background: string;
        text: string;
      };
      reprogramada: {
        background: string;
        text: string;
      };
    };
  };
  calendar: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
  };
  graphic: {
    linePrimary: string;
    lineSecondary: string;
    lineThird: string;
    lineMax: string;
    circle: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
      quaternary?: string;
      quinary?: string;
      scenery?: string;
    };
  };
}

const Colors: IColors = {
  buttons: {
    primary: "#CC0000",
    secondary: "#6c757d",
    tertiary: "#7C7C7C",
    quaternary: "#000000",
  },
  texts: {
    primary: "#0D141C",
    secondary: "#B20000",
    tertiary: "#3f4445",
    quaternary: "#ffffff",
    quinary: "#717680",
  },
  background: {
    primary: "#E8E8E8",
    secondary: "#F2F2F2",
    tertiary: "##626262",
  },
  table: {
    primary: "#ffffff",
    lines: "#E6E6E6",
    header: "#F4F4F4",
  },
  asideNavBackground: {
    primary: "#B20000",
  },
  states: {
    completed: "#015800",
    success: "#189416",
    pending: "#FFBB00",
    inactive: "#FF0000",
    nullable: "#B20000",
    appointment: {
      finalizado: {
        background: "#D2F5D3",
        text: "#168700",
      },
      pendiente: {
        background: "#E8D298",
        text: "#C47900",
      },
      cancelado: {
        background: "#F5D2D2",
        text: "#870000",
      },
      enProceso: {
        background: "#D2E5F5",
        text: "#2781FF",
      },
      cerrado: {
        background: "#D2D2D2",
        text: "#000000",
      },
      reprogramada: {
        background: "#FFE7B2",
        text: "#7d2aadff",
      },
    },
  },
  calendar: {
    primary: "#b20000",
    secondary: "#ffd6d6",
    tertiary: "#ffffff",
    quaternary: "#f4f4f4",
  },
  graphic: {
    linePrimary: "#B20000",
    lineSecondary: "#E9E9E9",
    lineThird: "#CC0000",
    lineMax: "#CC0000",
    circle: {
      primary: "#E60000",
      secondary: "#D00000",
      tertiary: "#B20000",
      quaternary: "#990000",
      quinary: "#800000",
      scenery: "#660000",
    },
  },
};

export default Colors;
