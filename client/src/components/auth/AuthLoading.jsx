export default function AuthLoading() {
    return (
        <div className="flex flex-col gap-4 font-medium mx-auto mt-20 text-gray-700 px-8 md:px-20">
            <p className="text-center">Loading profile data</p>
            <div className="loader mx-auto my-4"></div>
            <br />
            <br />
            <br />
            <div className="text-[10px] text-center sm:text-sm text-gray-500">
                <span>
                    If the page takes too long to load, this might be probably
                    due to a slow connecting time from the server.
                </span>
                <br />
                <br />
            </div>
            <br />
            <br />
        </div>
    );
}
