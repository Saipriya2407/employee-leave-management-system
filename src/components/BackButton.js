
// "use client";

// import { useRouter } from "next/navigation";

// export default function BackButton({ fallback = "/employee/dashboard" }) {
//   const router = useRouter();

//   function handleBack() {
//     if (window.history.length > 1) {
//       router.back();
//     } else {
//       router.push(fallback);
//     }
//   }

//   return (
//     <button
//       type="button"
//       onClick={handleBack}
//       className="group inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow-md active:scale-[0.98]"
//     >
//       <svg
//         className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
//         viewBox="0 0 24 24"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       >
//         <path d="M19 12H5" />
//         <path d="m12 19-7-7 7-7" />
//       </svg>

//       <span>Back</span>
//     </button>
//   );
// }


"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/employee/dashboard" }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className="group inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 active:scale-95"
    >
      <svg
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
}
