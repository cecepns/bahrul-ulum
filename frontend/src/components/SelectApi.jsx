import React from "react";
import AsyncSelect from "react-select/async";
import { request } from "../utils/request";

/**
 * Reusable React Select with Search by API and Debounce.
 * 
 * @param {string} endpoint - API endpoint to fetch options from
 * @param {function} mapOptions - Mapper function (item => { value, label })
 * @param {object} value - Selected option { value, label }
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Input placeholder
 * @param {boolean} isClearable - Option to clear select
 */
const SelectApi = ({
  endpoint,
  mapOptions,
  value,
  onChange,
  placeholder = "Cari...",
  isClearable = true,
  ...props
}) => {
  // Promise-based load options function for react-select Async
  const loadOptions = (inputValue, callback) => {
    // Add simple local debouncing (handled by react-select internal or timeout)
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await request.get(endpoint, { search: inputValue });
        if (response.success && response.data) {
          const formatted = response.data.map(mapOptions);
          callback(formatted);
        } else {
          callback([]);
        }
      } catch (err) {
        console.error("Error loading select options:", err);
        callback([]);
      }
    }, 500); // 500ms debounce as per user rule and brainstorming

    return () => clearTimeout(delayDebounceFn);
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      className="react-select-container"
      classNamePrefix="react-select"
      noOptionsMessage={({ inputValue }) =>
        inputValue ? "Data tidak ditemukan" : "Ketik untuk mencari"
      }
      loadingMessage={() => "Mencari..."}
      {...props}
    />
  );
};

export default SelectApi;
