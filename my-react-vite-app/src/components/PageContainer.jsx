const MAX_WIDTHS = {
  default: 'max-w-[1400px]',
  medium: 'max-w-[1200px]',
  narrow: 'max-w-[1100px]',
};

/** The centered, responsively-padded wrapper shared by every top-level page. */
function PageContainer({ children, size = 'default', className = '' }) {
  return (
    <div className={`mx-auto w-full p-4 sm:px-8 sm:pb-12 sm:pt-6 ${MAX_WIDTHS[size]} ${className}`}>{children}</div>
  );
}

export default PageContainer;
