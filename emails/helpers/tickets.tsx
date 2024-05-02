import {
  Body,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WorkEmailValidationEmailProps {
  children: React.ReactNode;
  preview?: string | string[];
}

export const TicketTemplate = ({
  preview,
  children,
}: WorkEmailValidationEmailProps) => (
  <Tailwind
    config={{
      theme: {
        extend: {
          colors: {
            // Brand
            primary: "#2754C5",
            secondary: "#4F46E5",
            // Actionables
            success: "#198754",
            danger: "#DC3545",
            warning: "#FFC107",
            // Grays
            info: "#0DCAF0",
            light: "#ebedf0",
            dark: "#0c0a09",
            muted: "#909090",
            // Neutrals
            white: "#FFFFFF",
            black: "#000000",
          },
        },
      },
    }}
  >
    <Html className="bg-dark text-white" lang="es">
      <Head>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={800}
          fontStyle="bold"
        />
      </Head>
      {preview && <Preview>Tus tickets están listos</Preview>}
      <Body>{children}</Body>
    </Html>
  </Tailwind>
);

export const Footer = () => (
  <section className="bg-dark text-white p-4">
    <p className="text-center text-sm text-muted">
      Este evento está apoyado por{" "}
      <Link href="https://communityos.io">
        <strong>communityos.io</strong>
      </Link>
    </p>
  </section>
);

export const BigFooter = () => (
  <Section className="mx-auto py-4 w-full text-white">
    <div className="mb-6">
      <a href="https://communityos.io/" className="flex items-center mb-6">
        <svg
          className="h-8 w-auto me-3"
          width="250"
          height="43"
          viewBox="0 0 250 43"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M240.78 27.484C241.834 27.484 242.69 27.3679 243.348 27.1357C244.596 26.6907 245.22 25.8635 245.22 24.6542C245.22 23.948 244.911 23.4014 244.292 23.0144C243.672 22.6372 242.7 22.3034 241.375 22.0132L239.111 21.5053C236.886 21.0022 235.348 20.4556 234.496 19.8655C233.055 18.8787 232.334 17.3357 232.334 15.2363C232.334 13.3208 233.031 11.7294 234.424 10.4621C235.817 9.19476 237.863 8.5611 240.562 8.5611C242.816 8.5611 244.737 9.1609 246.323 10.3605C247.919 11.5504 248.756 13.2821 248.834 15.5556H244.538C244.461 14.2689 243.9 13.3547 242.855 12.8129C242.158 12.455 241.292 12.276 240.257 12.276C239.106 12.276 238.187 12.5082 237.5 12.9726C236.813 13.4369 236.47 14.0851 236.47 14.9171C236.47 15.6814 236.808 16.2521 237.486 16.6294C237.921 16.881 238.85 17.176 240.272 17.5146L243.958 18.3998C245.573 18.7868 246.792 19.3044 247.615 19.9525C248.892 20.9587 249.53 22.4146 249.53 24.3205C249.53 26.2747 248.78 27.9 247.281 29.1963C245.791 30.483 243.682 31.1263 240.954 31.1263C238.168 31.1263 235.976 30.4927 234.38 29.2253C232.784 27.9483 231.986 26.1973 231.986 23.9722H236.252C236.388 24.9493 236.654 25.6797 237.05 26.1634C237.776 27.0438 239.019 27.484 240.78 27.484Z"
            fill="white"
          ></path>
          <path
            d="M219.346 31.1701C216.289 31.1701 213.953 30.3381 212.337 28.6742C210.17 26.6329 209.087 23.6919 209.087 19.8512C209.087 15.9332 210.17 12.9922 212.337 11.0283C213.953 9.36434 216.289 8.53235 219.346 8.53235C222.404 8.53235 224.74 9.36434 226.355 11.0283C228.513 12.9922 229.592 15.9332 229.592 19.8512C229.592 23.6919 228.513 26.6329 226.355 28.6742C224.74 30.3381 222.404 31.1701 219.346 31.1701ZM223.569 25.4236C224.604 24.1176 225.122 22.2601 225.122 19.8512C225.122 17.452 224.6 15.5994 223.555 14.2934C222.52 12.9777 221.117 12.3198 219.346 12.3198C217.576 12.3198 216.164 12.9728 215.109 14.2789C214.055 15.5849 213.527 17.4423 213.527 19.8512C213.527 22.2601 214.055 24.1176 215.109 25.4236C216.164 26.7296 217.576 27.3826 219.346 27.3826C221.117 27.3826 222.524 26.7296 223.569 25.4236Z"
            fill="white"
          ></path>
          <path
            d="M199.437 26.4249L202.702 14.7577H207.099L201.671 30.3139C200.627 33.3129 199.799 35.1704 199.19 35.8863C198.58 36.6119 197.362 36.9746 195.533 36.9746C195.165 36.9746 194.87 36.9698 194.648 36.9601C194.425 36.9601 194.092 36.9456 193.647 36.9166V33.608L194.169 33.637C194.575 33.6564 194.962 33.6419 195.33 33.5935C195.698 33.5451 196.007 33.4339 196.259 33.2597C196.5 33.0953 196.723 32.7518 196.926 32.2294C197.139 31.707 197.226 31.3878 197.187 31.2717L191.383 14.7577H195.983L199.437 26.4249Z"
            fill="white"
          ></path>
          <path
            d="M190.353 27.6295V30.7204L188.394 30.793C186.44 30.8607 185.104 30.5221 184.389 29.7772C183.924 29.3031 183.692 28.5727 183.692 27.5859V17.8488H181.486V14.903H183.692V10.4915H187.784V14.903H190.353V17.8488H187.784V26.2074C187.784 26.8555 187.866 27.2619 188.031 27.4263C188.195 27.5811 188.698 27.6585 189.54 27.6585C189.666 27.6585 189.797 27.6585 189.932 27.6585C190.077 27.6488 190.217 27.6391 190.353 27.6295Z"
            fill="white"
          ></path>
          <path
            d="M179.092 14.7579V30.5753H174.898V14.7579H179.092ZM179.092 9.05493V12.8714H174.898V9.05493H179.092Z"
            fill="white"
          ></path>
          <path
            d="M164.116 17.8196C162.713 17.8196 161.751 18.4145 161.228 19.6045C160.957 20.2333 160.822 21.0363 160.822 22.0134V30.5751H156.701V14.7867H160.691V17.094C161.223 16.2814 161.726 15.6961 162.201 15.3381C163.052 14.6996 164.131 14.3804 165.437 14.3804C167.072 14.3804 168.407 14.8109 169.442 15.6719C170.487 16.5232 171.009 17.9405 171.009 19.9237V30.5751H166.772V20.954C166.772 20.122 166.66 19.4835 166.438 19.0385C166.032 18.2259 165.258 17.8196 164.116 17.8196Z"
            fill="white"
          ></path>
          <path
            d="M148.647 28.3404C148.608 28.3887 148.511 28.5338 148.357 28.7757C148.202 29.0176 148.018 29.2304 147.805 29.4142C147.157 29.9947 146.528 30.3913 145.919 30.6041C145.319 30.817 144.613 30.9234 143.8 30.9234C141.459 30.9234 139.882 30.0817 139.069 28.3984C138.615 27.4697 138.387 26.1008 138.387 24.2917V14.7577H142.625V24.2917C142.625 25.1914 142.731 25.8686 142.944 26.3233C143.321 27.1262 144.061 27.5277 145.164 27.5277C146.576 27.5277 147.544 26.9569 148.066 25.8154C148.337 25.1962 148.473 24.3787 148.473 23.3629V14.7577H152.666V30.5751H148.647V28.3404Z"
            fill="white"
          ></path>
          <path
            d="M120.945 19.1114C120.596 18.3472 119.914 17.965 118.899 17.965C117.718 17.965 116.925 18.3472 116.519 19.1114C116.296 19.5468 116.185 20.1949 116.185 21.0559V30.5754H111.991V14.787H116.011V17.0943C116.524 16.272 117.007 15.6867 117.462 15.3385C118.265 14.7193 119.305 14.4097 120.582 14.4097C121.791 14.4097 122.768 14.6758 123.513 15.2079C124.113 15.7012 124.568 16.3349 124.877 17.1088C125.419 16.1801 126.091 15.4981 126.894 15.0627C127.746 14.6274 128.694 14.4097 129.739 14.4097C130.435 14.4097 131.122 14.5452 131.799 14.816C132.476 15.0869 133.091 15.561 133.642 16.2382C134.087 16.7896 134.387 17.4668 134.542 18.2698C134.639 18.8018 134.687 19.5806 134.687 20.6061L134.658 30.5754H130.421V20.5045C130.421 19.9047 130.324 19.4113 130.13 19.0244C129.763 18.2891 129.086 17.9215 128.099 17.9215C126.957 17.9215 126.169 18.3955 125.734 19.3436C125.511 19.8467 125.4 20.4513 125.4 21.1575V30.5754H121.235V21.1575C121.235 20.2191 121.138 19.5371 120.945 19.1114Z"
            fill="white"
          ></path>
          <path
            d="M94.5048 19.1114C94.1565 18.3472 93.4745 17.965 92.4587 17.965C91.2784 17.965 90.4851 18.3472 90.0788 19.1114C89.8563 19.5468 89.7451 20.1949 89.7451 21.0559V30.5754H85.5513V14.787H89.5709V17.0943C90.0837 16.272 90.5674 15.6867 91.0221 15.3385C91.825 14.7193 92.865 14.4097 94.142 14.4097C95.3513 14.4097 96.3284 14.6758 97.0733 15.2079C97.6731 15.7012 98.1278 16.3349 98.4374 17.1088C98.9791 16.1801 99.6515 15.4981 100.454 15.0627C101.306 14.6274 102.254 14.4097 103.299 14.4097C103.995 14.4097 104.682 14.5452 105.359 14.816C106.037 15.0869 106.651 15.561 107.202 16.2382C107.647 16.7896 107.947 17.4668 108.102 18.2698C108.199 18.8018 108.247 19.5806 108.247 20.6061L108.218 30.5754H103.981V20.5045C103.981 19.9047 103.884 19.4113 103.691 19.0244C103.323 18.2891 102.646 17.9215 101.659 17.9215C100.517 17.9215 99.7289 18.3955 99.2936 19.3436C99.0711 19.8467 98.9598 20.4513 98.9598 21.1575V30.5754H94.795V21.1575C94.795 20.2191 94.6983 19.5371 94.5048 19.1114Z"
            fill="white"
          ></path>
          <path
            d="M80.6465 16.7604C81.9816 18.4341 82.6491 20.4124 82.6491 22.6956C82.6491 25.0174 81.9816 27.0055 80.6465 28.6598C79.3115 30.3044 77.2847 31.1267 74.5662 31.1267C71.8478 31.1267 69.821 30.3044 68.486 28.6598C67.1509 27.0055 66.4834 25.0174 66.4834 22.6956C66.4834 20.4124 67.1509 18.4341 68.486 16.7604C69.821 15.0868 71.8478 14.2499 74.5662 14.2499C77.2847 14.2499 79.3115 15.0868 80.6465 16.7604ZM74.5517 17.7472C73.3425 17.7472 72.4089 18.1777 71.751 19.0387C71.1029 19.89 70.7788 21.109 70.7788 22.6956C70.7788 24.2822 71.1029 25.5059 71.751 26.367C72.4089 27.228 73.3425 27.6585 74.5517 27.6585C75.761 27.6585 76.6897 27.228 77.3379 26.367C77.9861 25.5059 78.3102 24.2822 78.3102 22.6956C78.3102 21.109 77.9861 19.89 77.3379 19.0387C76.6897 18.1777 75.761 17.7472 74.5517 17.7472Z"
            fill="white"
          ></path>
          <path
            d="M61.4044 28.9791C59.8081 30.4399 57.7668 31.1703 55.2806 31.1703C52.2041 31.1703 49.7856 30.1835 48.0249 28.21C46.2641 26.2268 45.3838 23.5083 45.3838 20.0546C45.3838 16.3203 46.3851 13.4422 48.3876 11.4203C50.129 9.65959 52.3444 8.77924 55.0339 8.77924C58.6327 8.77924 61.2641 9.9595 62.9281 12.32C63.8471 13.6454 64.3405 14.9756 64.4082 16.3107H59.9387C59.6485 15.2852 59.276 14.5112 58.8213 13.9888C58.0087 13.0601 56.8043 12.5957 55.208 12.5957C53.5827 12.5957 52.3009 13.2536 51.3625 14.5693C50.4241 15.8753 49.9549 17.7279 49.9549 20.1271C49.9549 22.5264 50.4483 24.3258 51.435 25.5254C52.4315 26.7153 53.694 27.3103 55.2225 27.3103C56.7897 27.3103 57.9845 26.7976 58.8068 25.7721C59.2615 25.2206 59.6388 24.3935 59.9387 23.2906H64.3647C63.9777 25.6221 62.9909 27.5183 61.4044 28.9791Z"
            fill="white"
          ></path>
          <path
            d="M36.4273 24.5302C35.742 24.5302 35.1709 25.1013 35.1709 25.7867V31.0867L19.5222 40.1332L3.80506 31.0867V28.6194C4.42187 28.2311 4.85592 27.5457 4.85592 26.7462C4.85592 25.5354 3.87359 24.5531 2.66282 24.5531C1.45205 24.5531 0.469727 25.5354 0.469727 26.7462C0.469727 27.4543 0.812399 28.0712 1.31498 28.4824V31.8177C1.31498 32.2746 1.56627 32.6858 1.95463 32.9142L18.6313 42.509C18.8597 42.7603 19.2024 42.8745 19.5222 42.8745H19.5451C19.5679 42.8745 19.5908 42.8745 19.6136 42.8745C19.9563 42.8745 20.2761 42.7375 20.5274 42.4862L37.0898 32.8914C37.4782 32.6629 37.7067 32.2517 37.7067 31.7948V25.7867C37.6838 25.1013 37.1127 24.5302 36.4273 24.5302Z"
            fill="white"
          ></path>
          <path
            d="M1.9088 13.2448L11.2066 18.6818C11.298 19.8012 12.2575 20.6921 13.3997 20.6921C14.6105 20.6921 15.5928 19.7098 15.5928 18.499C15.5928 17.2883 14.6105 16.3059 13.3997 16.3059C13.057 16.3059 12.7372 16.3745 12.4631 16.5116L5.01569 12.1482L19.4993 3.58143L28.2716 8.60727C28.8656 8.94994 29.6423 8.74434 29.985 8.15038C30.3277 7.55642 30.1221 6.77969 29.5281 6.43702L20.1161 1.04566C19.7277 0.817217 19.248 0.817217 18.8596 1.04566L1.9088 11.0745C1.52044 11.3029 1.29199 11.7142 1.29199 12.1482C1.29199 12.6051 1.52044 13.0163 1.9088 13.2448Z"
            fill="white"
          ></path>
          <path
            d="M36.4276 9.95544C35.2853 9.95544 34.3487 10.8235 34.2345 11.9429L18.86 20.9438C18.4716 21.1722 18.2432 21.5834 18.2432 22.0175V28.6881C18.2432 29.3735 18.8143 29.9446 19.4996 29.9446C20.185 29.9446 20.7561 29.3735 20.7561 28.6881V22.7485L35.4453 14.1589C35.7422 14.2959 36.0621 14.3873 36.4276 14.3873C37.6383 14.3873 38.6207 13.405 38.6207 12.1942C38.6207 10.9378 37.6383 9.95544 36.4276 9.95544Z"
            fill="white"
          ></path>
        </svg>
      </a>
    </div>
    <div className="md:flex md:justify-between space-y-9 md:space-y-0 mb-12 md:mb-6">
      <div className="text-center text-right text-sm mb-4">
        <h2 className="">Síguenos</h2>
        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com/communityos_"
            target="_blank"
            className="sm:!ml-0 text-white"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 17"
            >
              <path
                fill-rule="evenodd"
                d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">CommunityOS Twitter page</span>
          </a>
          <a
            href="https://github.com/communityos"
            target="_blank"
            className="text-white"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">GitHub account</span>
          </a>
          <a
            href="https://www.instagram.com/communityos.io"
            target="_blank"
            className="text-white"
          >
            <svg
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span className="sr-only">Instagram account</span>
          </a>
        </div>
      </div>
      <div className="text-center text-right text-sm mb-4">
        <h2 className="">Contacto</h2>
        <ul className="list-none font-medium space-y-4">
          <li>
            <a
              href="mailto:contacto@communityOS.io"
              target="_blank"
              className="no-underline text-white"
            >
              contacto@communityos.io
            </a>
          </li>
        </ul>
      </div>
      <div className="text-center text-right text-sm mb-4">
        <h2 className="">Información</h2>
        <ul className="list-none font-medium space-y-4">
          <li>
            <a
              href="https://github.com/CommunityOS/code_of_conduct/blob/main/terminos_de_servicio/README.md"
              target="_blank"
              className="no-underline text-white"
            >
              Términos y Condiciones
            </a>
          </li>
          <li>
            <a
              href="https://github.com/CommunityOS/code_of_conduct/blob/main/politica_de_privacidad/README.md"
              target="_blank"
              className="no-underline text-white"
            >
              Política de Privacidad
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div>
      <span className="text-sm block  font-medium text-center">
        © 2024 Proudly Powered by CommunityOS
      </span>
    </div>
  </Section>
);
