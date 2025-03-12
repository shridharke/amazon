"use client"
import { SignIn } from "@/action/auth-action";
import { SiteLogo } from "@/components/svg";
import { Button } from "@/components/ui/button";
import googleIcon from "@/public/images/auth/google.png";
import Image from "next/image";
import Link from "next/link";

const LogInForm = () => {
  return (
    <div className="w-full ">
      <Link href="/dashboard" className="inline-block">
        <SiteLogo className="h-10 w-10 2xl:h-14 2xl:w-14 text-primary" />
      </Link>
      <div className="2xl:mt-8 mt-6 2xl:text-3xl text-2xl font-bold text-default-900">
        Hey, Hello 👋
      </div>
      <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6">
        Login with Google to continue.
      </div>
      <div className="2xl:mt-8 mt-6">
        <form
          action={() => {
            SignIn()
          }}
        >
          <Button
            type="submit"
            size="icon"
            variant="outline"
            className="w-full text-lg text-default-600 rounded-lg border-default-300 hover:text-blue-600 hover:bg-background"
          >
            <Image
              src={googleIcon}
              alt="google"
              className="w-5 h-5 mr-5"
              priority={true}
            />
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LogInForm;
