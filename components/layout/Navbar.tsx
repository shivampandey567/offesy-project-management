'use client'

import Link from 'next/link';
import { Button } from '../ui/button';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

const Navbar = () => {
    return (
        <>
            <nav className="fixed bg-white/20 dark:bg-black/20 z-10 backdrop-blur-md top-0 left-0 w-full flex items-center justify-between py-4 px-6 md:px-8 md:py-3 lg:px-12 xl:px-15">
                <h2 className="text-xl font-medium md:text-2xl md:font-semibold">offesy</h2>
                <Link href='/'>
                    <div className='flex items-center gap-1'>
                        <Show when="signed-out">
                            <SignInButton mode='modal'>
                                <Button variant='ghost' className='rounded-full'>
                                    Sign In
                                </Button>
                            </SignInButton>
                            <SignUpButton mode='modal'>
                                <Button variant='default' size='lg' className=" md:block rounded-full px-3 cursor-pointer bg-black dark:bg-white ">
                                    Get Started
                                </Button>
                            </SignUpButton>
                        </Show>
                        <Show when="signed-in">
                            <UserButton />
                        </Show>
                    </div>
                </Link>
            </nav>
        </>
    )
}

export default Navbar